-- MySQL 8.0+ schema reconstructed from the Base44 portfolio project.
-- Source project: base44Portfolio
-- Purpose: replace Base44 entities/auth/storage with a self-hosted MySQL backend.
-- Character set chosen for full Unicode/emoji support.

CREATE DATABASE IF NOT EXISTS portfolio_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE portfolio_db;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =========================================================
-- AUTHENTICATION / USERS
-- Base44's User entity only declares `role`, but the app also uses
-- email/password, OTP verification, password reset and Google login.
-- These support tables replace those platform-managed features.
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('admin','user') NOT NULL DEFAULT 'user',
  display_name VARCHAR(255) NULL,
  avatar_url TEXT NULL,
  email_verified_at DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_base44_id (base44_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255) NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_oauth_provider_user (provider, provider_user_id),
  KEY idx_oauth_user_id (user_id),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_verification_user (user_id),
  KEY idx_verification_expiry (expires_at),
  CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_token_hash (token_hash),
  KEY idx_password_reset_user (user_id),
  KEY idx_password_reset_expiry (expires_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_token_hash (token_hash),
  KEY idx_refresh_user (user_id),
  KEY idx_refresh_expiry (expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: SiteSettings
-- The application expects zero or one active record and reads the first row.
-- =========================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  full_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(255) NULL,
  professional_title VARCHAR(255) NULL,
  tagline TEXT NULL,
  biography LONGTEXT NULL,
  professional_summary LONGTEXT NULL,
  profile_picture TEXT NULL,
  logo TEXT NULL,
  favicon LONGTEXT NULL,
  admin_brand_name VARCHAR(120) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(100) NULL,
  location VARCHAR(255) NULL,
  years_experience INT NOT NULL DEFAULT 0,
  availability_status TINYINT(1) NOT NULL DEFAULT 1,
  availability_message TEXT NULL,
  hero_heading TEXT NULL,
  hero_introduction LONGTEXT NULL,
  accent_color VARCHAR(20) NOT NULL DEFAULT '#C2410C',
  resume_url TEXT NULL,
  default_seo_image TEXT NULL,
  seo_title VARCHAR(255) NULL,
  seo_description TEXT NULL,
  footer_cta_heading TEXT NULL,
  footer_cta_subheading TEXT NULL,
  interests JSON NULL,
  personal_statement LONGTEXT NULL,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_site_settings_base44_id (base44_id),
  CONSTRAINT fk_site_settings_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: SocialLink
-- =========================================================

CREATE TABLE IF NOT EXISTS social_links (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  platform VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_links_base44_id (base44_id),
  KEY idx_social_links_order (display_order),
  KEY idx_social_links_enabled (enabled),
  CONSTRAINT fk_social_links_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: ProjectCategory
-- =========================================================

CREATE TABLE IF NOT EXISTS project_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_project_categories_base44_id (base44_id),
  UNIQUE KEY uq_project_categories_slug (slug),
  KEY idx_project_categories_order (display_order),
  CONSTRAINT fk_project_categories_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Project
-- NOTE: `category` is intentionally VARCHAR, not a FK, because the Base44
-- schema stores it as a string. JSON columns preserve current frontend payloads.
-- =========================================================

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  overview LONGTEXT NULL,
  category VARCHAR(255) NULL,
  client VARCHAR(255) NULL,
  `role` VARCHAR(255) NULL,
  `year` SMALLINT UNSIGNED NULL,
  technologies JSON NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  display_order INT NOT NULL DEFAULT 0,
  cover_image TEXT NULL,
  thumbnail TEXT NULL,
  gallery_images JSON NULL,
  project_url TEXT NULL,
  github_url TEXT NULL,
  challenge LONGTEXT NULL,
  approach LONGTEXT NULL,
  solution LONGTEXT NULL,
  features JSON NULL,
  results JSON NULL,
  start_date DATE NULL,
  completion_date DATE NULL,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_base44_id (base44_id),
  UNIQUE KEY uq_projects_slug (slug),
  KEY idx_projects_status (status),
  KEY idx_projects_featured (featured),
  KEY idx_projects_order (display_order),
  KEY idx_projects_category (category),
  KEY idx_projects_updated (updated_date),
  CONSTRAINT fk_projects_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Skill
-- =========================================================

CREATE TABLE IF NOT EXISTS skills (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NULL,
  icon VARCHAR(255) NULL,
  level ENUM('beginner','intermediate','advanced','expert') NOT NULL DEFAULT 'intermediate',
  years_experience INT NOT NULL DEFAULT 0,
  description TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_base44_id (base44_id),
  KEY idx_skills_visible_order (visible, display_order),
  KEY idx_skills_category (category),
  CONSTRAINT fk_skills_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Experience
-- =========================================================

CREATE TABLE IF NOT EXISTS experiences (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255) NULL,
  employment_type ENUM('full-time','part-time','contract','freelance','internship') NOT NULL DEFAULT 'full-time',
  start_date DATE NULL,
  end_date DATE NULL,
  currently_working TINYINT(1) NOT NULL DEFAULT 0,
  description LONGTEXT NULL,
  responsibilities JSON NULL,
  technologies JSON NULL,
  company_logo TEXT NULL,
  company_url TEXT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experiences_base44_id (base44_id),
  KEY idx_experiences_order (display_order),
  KEY idx_experiences_dates (start_date, end_date),
  CONSTRAINT fk_experiences_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Education
-- =========================================================

CREATE TABLE IF NOT EXISTS education (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  school VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255) NULL,
  start_year SMALLINT UNSIGNED NULL,
  end_year SMALLINT UNSIGNED NULL,
  description LONGTEXT NULL,
  logo TEXT NULL,
  favicon LONGTEXT NULL,
  location VARCHAR(255) NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_education_base44_id (base44_id),
  KEY idx_education_order (display_order),
  CONSTRAINT fk_education_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Certification
-- =========================================================

CREATE TABLE IF NOT EXISTS certifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date DATE NULL,
  expiration_date DATE NULL,
  credential_id VARCHAR(255) NULL,
  credential_url TEXT NULL,
  certificate_image TEXT NULL,
  description LONGTEXT NULL,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_certifications_base44_id (base44_id),
  KEY idx_certifications_issue_date (issue_date),
  CONSTRAINT fk_certifications_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Service
-- =========================================================

CREATE TABLE IF NOT EXISTS services (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NULL,
  icon VARCHAR(255) NULL,
  features JSON NULL,
  display_order INT NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_base44_id (base44_id),
  KEY idx_services_visible_order (visible, display_order),
  CONSTRAINT fk_services_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: Testimonial
-- =========================================================

CREATE TABLE IF NOT EXISTS testimonials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  person_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NULL,
  organization VARCHAR(255) NULL,
  profile_picture TEXT NULL,
  testimonial LONGTEXT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_testimonials_base44_id (base44_id),
  KEY idx_testimonials_visible_order (visible, display_order),
  KEY idx_testimonials_featured (featured),
  CONSTRAINT chk_testimonials_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_testimonials_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: ContactMessage
-- Public create; admin-only read/update/delete in the current RLS rules.
-- =========================================================

CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NULL,
  subject VARCHAR(255) NULL,
  project_type VARCHAR(255) NULL,
  budget_range VARCHAR(255) NULL,
  message LONGTEXT NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  archived TINYINT(1) NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contact_messages_base44_id (base44_id),
  KEY idx_contact_messages_created (created_date),
  KEY idx_contact_messages_read_archived (`read`, archived),
  KEY idx_contact_messages_email (email),
  CONSTRAINT fk_contact_messages_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- BASE44 ENTITY: RoadmapItem
-- Admin-only in the current Base44 RLS rules.
-- =========================================================

CREATE TABLE IF NOT EXISTS roadmap_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  base44_id VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NULL,
  status ENUM('backlog','in-progress','on-hold','completed') NOT NULL DEFAULT 'backlog',
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  category VARCHAR(255) NULL,
  target_date DATE NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roadmap_items_base44_id (base44_id),
  KEY idx_roadmap_status_priority (status, priority),
  KEY idx_roadmap_order (display_order),
  KEY idx_roadmap_target_date (target_date),
  CONSTRAINT fk_roadmap_items_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- FILE STORAGE METADATA
-- Replaces Base44 Core.UploadFile metadata. File bytes should live on disk,
-- object storage, or another storage service; MySQL stores metadata/URL only.
-- =========================================================

CREATE TABLE IF NOT EXISTS uploaded_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  original_name VARCHAR(500) NOT NULL,
  stored_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255) NULL,
  size_bytes BIGINT UNSIGNED NULL,
  storage_driver VARCHAR(50) NOT NULL DEFAULT 'local',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_by_id BIGINT UNSIGNED NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_uploaded_files_created_by (created_by_id),
  KEY idx_uploaded_files_created_date (created_date),
  CONSTRAINT fk_uploaded_files_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- =========================================================
-- EMAIL NOTIFICATION SETTINGS (admin-only)
-- SMTP credentials stay in environment variables; only safe preferences live here.
-- =========================================================

CREATE TABLE IF NOT EXISTS email_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  notification_email VARCHAR(255) NULL,
  reply_signature TEXT NULL,
  created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_message_replies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  contact_message_id BIGINT UNSIGNED NOT NULL,
  admin_user_id BIGINT UNSIGNED NULL,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  provider_message_id VARCHAR(500) NULL,
  sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_replies_message (contact_message_id, sent_date),
  KEY idx_contact_replies_admin (admin_user_id)
) ENGINE=InnoDB;

INSERT INTO email_settings (notifications_enabled)
SELECT 1
WHERE NOT EXISTS (SELECT 1 FROM email_settings);

SET FOREIGN_KEY_CHECKS = 1;
