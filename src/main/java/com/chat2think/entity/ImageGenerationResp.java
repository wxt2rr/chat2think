package com.chat2think.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ImageGenerationResp {
    private Long id;

    private User user;

    private String modelName;

    private String prompt;

    private String sourceImagePath;

    private String resultImagePath;

    private String style;

    private String size;

    private GenerationStatus status;

    private String errorMessage;

    private LocalDateTime createdAt;

    private Type type;

    private String resultImageUrl;

    public enum GenerationStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    public enum Type {
        GENERATE,
        EDIT
    }
}