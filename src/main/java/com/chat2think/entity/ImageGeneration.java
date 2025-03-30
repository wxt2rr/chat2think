package com.chat2think.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "image_generations")
public class ImageGeneration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String modelName;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "source_image_path")
    private String sourceImagePath;

    @Column(name = "result_image_path", nullable = false)
    private String resultImagePath;

    @Column(nullable = false)
    private String style;

    @Column(nullable = false)
    private String size;

    @Column(name = "generation_status")
    @Enumerated(EnumType.STRING)
    private GenerationStatus status;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private Type type;

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