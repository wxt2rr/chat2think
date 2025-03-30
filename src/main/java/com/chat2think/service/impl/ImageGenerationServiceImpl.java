package com.chat2think.service.impl;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.chat2think.entity.ImageGeneration;
import com.chat2think.entity.ImageGenerationResp;
import com.chat2think.entity.User;
import com.chat2think.repository.ImageGenerationRepository;
import com.chat2think.repository.UserRepository;
import com.chat2think.service.ImageGenerationService;
import com.openai.core.JsonObject;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageGenerationServiceImpl implements ImageGenerationService {

    private final ImageGenerationRepository imageGenerationRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final RestTemplate restTemplate;

    @Value("${app.image.upload.dir}")
    private String uploadDir;

    @Value("${app.image.models[0].api-url}")
    private String stableDiffusionApiUrl;

    @Value("${app.image.models[1].api-url}")
    private String dalleApiUrl;

    @Override
    @Transactional
    public ImageGenerationResp generateImage(Long userId, String modelName, String prompt,
                                             MultipartFile sourceImage, String style, String size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ImageGeneration generation = new ImageGeneration();
        generation.setType(ImageGeneration.Type.GENERATE);

        if (sourceImage != null) {
            String sourcePath = uploadImage(sourceImage);
            generation.setSourceImagePath(sourcePath);
            generation.setType(ImageGeneration.Type.EDIT);
        }

        generation.setUser(user);
        generation.setModelName(modelName);
        generation.setPrompt(prompt);
        generation.setStyle(style);
        generation.setSize(size);
        generation.setStatus(ImageGeneration.GenerationStatus.PENDING);
        generation.setResultImagePath("");
        generation = imageGenerationRepository.save(generation);

        // 异步处理图片生成
        ImageGenerationResp imageGenerationResp = processImageGeneration(generation);
        imageGenerationRepository.save(generation);
        return imageGenerationResp;
    }

    @Override
    public ImageGeneration getGenerationStatus(Long generationId) {
        return imageGenerationRepository.findById(generationId)
                .orElseThrow(() -> new RuntimeException("Generation not found"));
    }

    @Override
    @Transactional
    public void cancelGeneration(Long generationId) {
        ImageGeneration generation = getGenerationStatus(generationId);
        if (generation.getStatus() == ImageGeneration.GenerationStatus.PROCESSING) {
            generation.setStatus(ImageGeneration.GenerationStatus.FAILED);
            generation.setErrorMessage("Generation cancelled by user");
            imageGenerationRepository.save(generation);
        }
    }

    @Override
    public String uploadImage(MultipartFile image) {
        try {
            String fileName = UUID.randomUUID().toString() + "-" + image.getOriginalFilename();
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);

            Files.copy(image.getInputStream(), filePath);
            File file = compressAndConvertToPng(filePath.toFile());
            return file.getPath();
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    @Override
    public byte[] getGeneratedImage(String imagePath) {
        try {
            Path path = Paths.get(uploadDir, imagePath);
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read image", e);
        }
    }

    private File compressAndConvertToPng(File inputFile) throws IOException {
        // 读取原图
        BufferedImage image = ImageIO.read(inputFile);
        if (image == null) {
            throw new IOException("Failed to read image: " + inputFile.getAbsolutePath());
        }

        BufferedImage rgbaImage;
        if (image.getType() != BufferedImage.TYPE_INT_ARGB) {
            rgbaImage = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_ARGB);
            rgbaImage.getGraphics().drawImage(image, 0, 0, null);
        } else {
            rgbaImage = image; // 已经是 RGBA 模式，直接使用
        }

        // 创建临时文件
        File outputFile = new File(inputFile.getPath().replace(".jpg", "-c.png"));

        // 初始压缩质量
        float quality = 0.9f;

        // 尝试压缩直到文件大小小于 4MB
        while (true) {
            // 将图像写入 PNG 文件
            try (FileOutputStream fos = new FileOutputStream(outputFile);
                 ImageOutputStream ios = ImageIO.createImageOutputStream(fos)) {
                ImageWriter writer = ImageIO.getImageWritersByFormatName("png").next();
                writer.setOutput(ios);

                ImageWriteParam param = writer.getDefaultWriteParam();
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(quality);
                }

                writer.write(null, new IIOImage(rgbaImage, null, null), param);
                writer.dispose();
            }

            // 检查文件大小
            long fileSize = outputFile.length();
            if (fileSize <= 4 * 1024 * 1024 || quality <= 0.1f) {
                break; // 文件大小符合要求，或质量已降到最低
            }

            // 减小质量并重试
            quality -= 0.1f;
            System.out.println("File size " + fileSize + " exceeds 4MB, reducing quality to " + quality);
        }

        // 验证最终文件大小
        long finalSize = outputFile.length();
        if (finalSize > 4 * 1024 * 1024) {
            throw new IOException("Failed to compress image to under 4MB. Final size: " + finalSize + " bytes");
        }

        System.out.println("Compressed image size: " + finalSize + " bytes");
        return outputFile;
    }

    private ImageGenerationResp processImageGeneration(ImageGeneration generation) {
        int maxRetries = 10;
        int retryCount = 0;
        Exception lastException = null;

        while (retryCount < maxRetries) {
            try {
                generation.setStatus(ImageGeneration.GenerationStatus.PROCESSING);
                imageGenerationRepository.save(generation);

                String apiUrl = generation.getType() == ImageGeneration.Type.GENERATE ? "https://api.zhizengzeng.com/v1/images/generations" : "https://api.zhizengzeng.com/v1/images/edits";
                String apiKey = "sk-zk2ee41a70437b7d1426770fd805a8ba8dc67e911310327f";

                // 设置请求头
                HttpHeaders headers = new HttpHeaders();
                if (generation.getType() == ImageGeneration.Type.GENERATE) {
                    headers.setContentType(MediaType.APPLICATION_JSON);
                } else {
                    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                }
                headers.set("Authorization", "Bearer " + apiKey);

                // 构造请求实体
                ResponseEntity<String> response = null;
                if (generation.getType() == ImageGeneration.Type.GENERATE) {
                    Map<String, Object> formData = new HashMap<>();
                    formData.put("prompt", generation.getPrompt());                           // 提示词
                    formData.put("n", 1);                     // 生成数量
                    formData.put("size", generation.getSize());                               // 图片尺寸
                    formData.put("model", "dall-e-2");// 图片尺寸
                    formData.put("response_format", "url");// 图片尺寸
                    HttpEntity<String> requestEntity = new HttpEntity<>(JSON.toJSONString(formData), headers);
                    response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, String.class);
                } else {
                    // 构造表单数据
                    MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
                    if (generation.getSourceImagePath() != null) {
                        formData.add("image", new FileSystemResource(generation.getSourceImagePath())); // 图片文件
                        formData.add("mask", "");   // 遮罩文件
                    }
                    formData.add("prompt", generation.getPrompt());                           // 提示词
                    formData.add("n", "1");                     // 生成数量
                    formData.add("size", generation.getSize());                               // 图片尺寸
                    formData.add("model", "dall-e-3");// 图片尺寸
                    formData.add("response_format", "url");// 图片尺寸
                    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(formData, headers);
                    response = restTemplate.exchange(apiUrl, HttpMethod.POST, requestEntity, String.class);
                }
                // 发送请求
                System.out.println(response.getBody());

                JSONObject responseJson = JSONObject.parseObject(response.getBody());
                if (responseJson != null && responseJson.containsKey("data")) {
                    String string = responseJson.getJSONArray("data").getJSONObject(0).getString("url");

                    // String resultPath = saveGeneratedImage(responseJson.getString("image"));
                    //generation.setResultImagePath(string);
                    // generation.setResultImageUrl(string);
                    generation.setStatus(ImageGeneration.GenerationStatus.COMPLETED);
                    imageGenerationRepository.save(generation);

                    ImageGenerationResp resp = new ImageGenerationResp();
                    BeanUtils.copyProperties(generation, resp);
                    resp.setResultImageUrl(string);
                    return resp;
                } else {
                    throw new RuntimeException("API response does not contain image data");
                }
            } catch (Exception e) {
                lastException = e;
                retryCount++;

                if (retryCount < maxRetries) {
                    try {
                        // 指数退避重试，等待时间随重试次数增加
                        Thread.sleep((long) Math.pow(2, retryCount) * 1000);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        // 所有重试都失败后的处理
        generation.setStatus(ImageGeneration.GenerationStatus.FAILED);
        generation.setErrorMessage(lastException != null ?
                String.format("Failed after %d retries. Last error: %s", maxRetries, lastException.getMessage()) :
                "Failed to generate image after multiple attempts");
        generation.setResultImagePath("");
        imageGenerationRepository.save(generation);

        ImageGenerationResp resp = new ImageGenerationResp();
        BeanUtils.copyProperties(generation, resp);
        return resp;
    }

    private String saveGeneratedImage(String base64Image) {
        try {
            String fileName = "generated-" + UUID.randomUUID().toString() + ".png";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Image);
            Path filePath = uploadPath.resolve(fileName);
            Files.write(filePath, imageBytes);

            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save generated image", e);
        }
    }
}