package com.chat2think.controller;

import com.chat2think.entity.ImageGeneration;
import com.chat2think.entity.ImageGenerationResp;
import com.chat2think.entity.User;
import com.chat2think.service.ImageGenerationService;
import com.chat2think.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageGenerationController {

    private final ImageGenerationService imageGenerationService;

    private final UserService userService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateImage(
            Authentication authentication,
            @RequestParam String modelName,
            @RequestParam String prompt,
            @RequestParam(required = false) MultipartFile sourceImage,
            @RequestParam String style,
            @RequestParam String size) {

        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.findByUsername(authentication.getName());
        if (user == null) {
            return ResponseEntity.status(404).build();
        }

        ImageGenerationResp generation = imageGenerationService.generateImage(user.getId(), modelName, prompt, sourceImage, style, size);

        Map<String, Object> response = new HashMap<>();
        response.put("generationId", generation.getId());
        response.put("status", generation.getStatus());
        response.put("url", generation.getResultImageUrl());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{generationId}")
    public ResponseEntity<?> getGenerationStatus(@PathVariable Long generationId,
                                                 Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.findByUsername(authentication.getName());
        if (user == null) {
            return ResponseEntity.status(404).build();
        }

        ImageGeneration generation = imageGenerationService.getGenerationStatus(generationId);
        if (generation == null) {
            return ResponseEntity.status(404).build();
        }

        if (!generation.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).build();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("status", generation.getStatus());
        response.put("errorMessage", generation.getErrorMessage());
        if (generation.getStatus() == ImageGeneration.GenerationStatus.COMPLETED) {
            response.put("resultImagePath", generation.getResultImagePath());
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cancel/{generationId}")
    public ResponseEntity<?> cancelGeneration(@PathVariable Long generationId) {
        imageGenerationService.cancelGeneration(generationId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/download/{imagePath}")
    public ResponseEntity<byte[]> getImage(@PathVariable String imagePath) {
        byte[] imageData = imageGenerationService.getGeneratedImage(imagePath);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(imageData.length);

        return new ResponseEntity<>(imageData, headers, HttpStatus.OK);
    }
}