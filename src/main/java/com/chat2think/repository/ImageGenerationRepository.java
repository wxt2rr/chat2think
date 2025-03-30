package com.chat2think.repository;

import com.chat2think.entity.ImageGeneration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImageGenerationRepository extends JpaRepository<ImageGeneration, Long> {
    List<ImageGeneration> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ImageGeneration> findByStatusOrderByCreatedAtAsc(ImageGeneration.GenerationStatus status);
}