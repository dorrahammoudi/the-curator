-- =============================================================
-- Academic Content Recommendation System - MySQL Schema
-- =============================================================

CREATE DATABASE IF NOT EXISTS academic_recommendation
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE academic_recommendation;

-- -------------------------------------------------------------
-- 1. users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  email       VARCHAR(191)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        ENUM('ETUDIANT','ENSEIGNANT','ADMIN') NOT NULL DEFAULT 'ETUDIANT',
  filiere     VARCHAR(100)  NULL,
  niveau      VARCHAR(50)   NULL,
  departement VARCHAR(100)  NULL,
  specialite  VARCHAR(100)  NULL,
  titre       VARCHAR(100)  NULL,
  telephone   VARCHAR(20)   NULL,
  adresse     TEXT          NULL,
  admin_email VARCHAR(191)  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. resources
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resources (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(50) NOT NULL,
  description TEXT,
  tags        JSON,
  file_url    VARCHAR(500),
  teacher_id  INT NOT NULL,
  teacher_name VARCHAR(255),
  departement VARCHAR(100) NULL,
  views       INT DEFAULT 0,
  downloads   INT DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. admin_resources
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_resources (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(50) NOT NULL,
  description TEXT,
  tags        JSON,
  file_url    VARCHAR(500),
  admin_id    INT NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  admin_name  VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. tags
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  category    VARCHAR(100) NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. resource_tags
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resource_tags (
  resource_id INT UNSIGNED NOT NULL,
  tag_id      INT UNSIGNED NOT NULL,
  weight      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-5',
  PRIMARY KEY (resource_id, tag_id),
  CONSTRAINT fk_rt_resource
    FOREIGN KEY (resource_id) REFERENCES resources(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rt_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 6. student_profile_tags
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_profile_tags (
  user_id     INT UNSIGNED NOT NULL,
  tag_id      INT UNSIGNED NOT NULL,
  weight      FLOAT NOT NULL DEFAULT 1.0 COMMENT 'dynamic weight',
  PRIMARY KEY (user_id, tag_id),
  CONSTRAINT fk_spt_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_spt_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 7. interactions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interactions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  resource_id INT UNSIGNED NOT NULL,
  type        ENUM('VIEW','DOWNLOAD','FAVORITE','IGNORE') NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_int_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_int_resource
    FOREIGN KEY (resource_id) REFERENCES resources(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 8. recommendations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  resource_id INT UNSIGNED NOT NULL,
  score       FLOAT NOT NULL DEFAULT 0,
  clicked     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rec_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rec_resource
    FOREIGN KEY (resource_id) REFERENCES resources(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Indexes for performance
-- -------------------------------------------------------------
CREATE INDEX idx_interactions_user ON interactions(user_id);
CREATE INDEX idx_interactions_res ON interactions(resource_id);
CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_resources_teacher ON resources(teacher_id);
CREATE INDEX idx_spt_user ON student_profile_tags(user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- -------------------------------------------------------------
-- Données initiales (optionnel)
-- -------------------------------------------------------------
INSERT IGNORE INTO tags (name, category) VALUES
('Intelligence Artificielle', 'Informatique'),
('Machine Learning', 'Informatique'),
('Deep Learning', 'Informatique'),
('Python', 'Programmation'),
('JavaScript', 'Programmation'),
('Big Data', 'Data Science'),
('Cybersécurité', 'Sécurité'),
('Blockchain', 'Technologie'),
('Cloud Computing', 'Infrastructure'),
('DevOps', 'Méthodologie');