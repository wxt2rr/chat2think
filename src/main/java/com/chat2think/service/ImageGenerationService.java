package com.chat2think.service;

import com.chat2think.entity.ImageGeneration;
import com.chat2think.entity.ImageGenerationResp;
import org.springframework.web.multipart.MultipartFile;

public interface ImageGenerationService {
    ImageGenerationResp generateImage(Long userId, String modelName, String prompt,
                                      MultipartFile sourceImage, String style, String size);

    ImageGeneration getGenerationStatus(Long generationId);

    void cancelGeneration(Long generationId);

    String uploadImage(MultipartFile image);

    byte[] getGeneratedImage(String imagePath);
}