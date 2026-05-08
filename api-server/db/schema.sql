CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  openid VARCHAR(128) NOT NULL,
  unionid VARCHAR(128) NULL,
  nickname VARCHAR(128) NULL,
  avatar_url VARCHAR(512) NULL,
  phone VARCHAR(32) NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_openid (openid),
  KEY idx_users_unionid (unionid),
  KEY idx_users_status (status),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_points (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  points INT NOT NULL DEFAULT 0,
  total_earned INT NOT NULL DEFAULT 0,
  total_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_points_user_id (user_id),
  CONSTRAINT fk_user_points_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS point_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type ENUM('grant', 'consume', 'refund', 'adjust') NOT NULL,
  amount INT NOT NULL,
  before_points INT NOT NULL,
  after_points INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  related_type VARCHAR(64) NULL,
  related_id BIGINT UNSIGNED NULL,
  operator_user_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_point_logs_user_id (user_id),
  KEY idx_point_logs_related (related_type, related_id),
  CONSTRAINT fk_point_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_point_logs_operator_user_id FOREIGN KEY (operator_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  template_id VARCHAR(128) NULL,
  model VARCHAR(128) NOT NULL,
  prompt MEDIUMTEXT NOT NULL,
  input_images_count INT NOT NULL DEFAULT 0,
  input_images_preview MEDIUMTEXT NULL,
  output_url MEDIUMTEXT NULL,
  status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  cost_points INT NOT NULL DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_generation_records_user_id (user_id),
  KEY idx_generation_records_template_id (template_id),
  KEY idx_generation_records_status (status),
  CONSTRAINT fk_generation_records_user_id FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
