-- 用户表
CREATE TABLE IF NOT EXISTS users
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER',
    status     TINYINT      NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 图片生成任务表
CREATE TABLE IF NOT EXISTS image_tasks
(
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT      NOT NULL,
    prompt          TEXT        NOT NULL,
    negative_prompt TEXT,
    model_id        BIGINT      NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    progress        INT         NOT NULL DEFAULT 0,
    error_message   TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 生成结果表
CREATE TABLE IF NOT EXISTS generated_images
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    task_id       BIGINT       NOT NULL,
    image_url     VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    width         INT          NOT NULL,
    height        INT          NOT NULL,
    seed          BIGINT,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task_id (task_id),
    FOREIGN KEY (task_id) REFERENCES image_tasks (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 模型配置表
CREATE TABLE IF NOT EXISTS model_configs
(
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL UNIQUE,
    description    TEXT,
    model_type     VARCHAR(50)  NOT NULL,
    base_url       VARCHAR(255) NOT NULL,
    api_key        VARCHAR(255),
    default_params JSON,
    status         TINYINT      NOT NULL DEFAULT 1,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_model_type (model_type)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- 邀请码邀请表
CREATE TABLE `invitation_code_use_record`
(
    `id`              bigint(20)   NOT NULL AUTO_INCREMENT,
    `code`            varchar(255) NOT NULL,
    `created_at`      datetime(6) DEFAULT NULL,
    `used`            bit(1)       NOT NULL,
    `used_at`         datetime(6) DEFAULT NULL,
    `used_by_user_id` bigint(20)  DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_used_by_user_id` (`used_by_user_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;

-- 邀请码表
CREATE TABLE `invitation_codes`
(
    `id`         bigint(20)   NOT NULL AUTO_INCREMENT,
    `code`       varchar(255) NOT NULL,
    `created_at` datetime(6) DEFAULT NULL,
    `used`       bit(1)       NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8;

CREATE TABLE `image_generations`
(
    `id`                bigint(20)   NOT NULL AUTO_INCREMENT,
    `created_at`        datetime(6)  DEFAULT NULL,
    `error_message`     text,
    `model_name`        varchar(255) NOT NULL,
    `prompt`            text,
    `result_image_path` varchar(255) NOT NULL,
    `size`              varchar(255) NOT NULL,
    `source_image_path` varchar(255) DEFAULT NULL,
    `generation_status` varchar(255) DEFAULT NULL,
    `style`             varchar(255) NOT NULL,
    `user_id`           bigint(20)   NOT NULL,
    `type`              int(11)      DEFAULT NULL,
    `result_url`        varchar(255) DEFAULT NULL,
    `result_image_url`  varchar(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  DEFAULT CHARSET = utf8