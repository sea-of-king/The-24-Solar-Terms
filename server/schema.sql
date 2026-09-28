CREATE DATABASE IF NOT EXISTS solar_terms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE solar_terms;

CREATE TABLE IF NOT EXISTS tree_hole_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(20) NOT NULL DEFAULT '无名来信',
  season ENUM('春', '夏', '秋', '冬') NOT NULL,
  content VARCHAR(280) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tree_hole_likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id BIGINT NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tree_hole_like (message_id, visitor_id),
  KEY idx_tree_hole_like_visitor_message (visitor_id, message_id),
  CONSTRAINT fk_tree_hole_like_message FOREIGN KEY (message_id) REFERENCES tree_hole_messages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tree_hole_comments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  nickname VARCHAR(20) NOT NULL DEFAULT '无名来信',
  content VARCHAR(280) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tree_hole_comment_message FOREIGN KEY (message_id) REFERENCES tree_hole_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_tree_hole_comment_parent FOREIGN KEY (parent_id) REFERENCES tree_hole_comments(id) ON DELETE CASCADE,
  INDEX idx_tree_hole_comment_message (message_id)
);
