package com.chat2think.service;

import com.chat2think.entity.ImageGeneration;
import com.chat2think.repository.ImageGenerationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@RequiredArgsConstructor
public class ImageGenerationQueueManager {

    private final ImageGenerationRepository imageGenerationRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    private final ConcurrentLinkedQueue<Long> generationQueue = new ConcurrentLinkedQueue<>();
    private static final String GENERATION_PROGRESS_KEY = "image:generation:progress:";

    public void addToQueue(Long generationId) {
        generationQueue.offer(generationId);
        redisTemplate.opsForValue().set(GENERATION_PROGRESS_KEY + generationId, 0);
        processQueue();
    }

    @Async
    public void processQueue() {
        Long generationId = generationQueue.poll();
        if (generationId != null) {
            try {
                ImageGeneration generation = imageGenerationRepository.findById(generationId)
                        .orElseThrow(() -> new RuntimeException("Generation not found"));

                // 更新进度
                updateProgress(generationId, 10, "开始处理图片生成任务");

                // 模拟图片生成过程
                for (int progress = 20; progress <= 90; progress += 10) {
                    Thread.sleep(1000); // 模拟处理时间
                    updateProgress(generationId, progress, "正在生成图片...");
                }

                // 完成生成
                generation.setStatus(ImageGeneration.GenerationStatus.COMPLETED);
                imageGenerationRepository.save(generation);
                updateProgress(generationId, 100, "图片生成完成");

            } catch (Exception e) {
                updateProgress(generationId, -1, "图片生成失败: " + e.getMessage());
                ImageGeneration generation = imageGenerationRepository.findById(generationId).orElse(null);
                if (generation != null) {
                    generation.setStatus(ImageGeneration.GenerationStatus.FAILED);
                    generation.setErrorMessage(e.getMessage());
                    imageGenerationRepository.save(generation);
                }
            }
        }
    }

    private void updateProgress(Long generationId, int progress, String message) {
        redisTemplate.opsForValue().set(GENERATION_PROGRESS_KEY + generationId, progress);
        messagingTemplate.convertAndSend(
                "/topic/generation/" + generationId,
                new GenerationProgress(progress, message)
        );
    }

    public Integer getProgress(Long generationId) {
        Object progress = redisTemplate.opsForValue().get(GENERATION_PROGRESS_KEY + generationId);
        return progress != null ? (Integer) progress : 0;
    }

    public static class GenerationProgress {
        private final int progress;
        private final String message;

        public GenerationProgress(int progress, String message) {
            this.progress = progress;
            this.message = message;
        }

        public int getProgress() {
            return progress;
        }

        public String getMessage() {
            return message;
        }
    }
}