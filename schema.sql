-- =======================================================
-- SecureVote — Secure Online Voting Prototype
-- Database Schema (MySQL / MariaDB)
-- Character Set: utf8mb4 (Full English & Tamil Unicode support)
-- =======================================================

CREATE DATABASE IF NOT EXISTS `securevote_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `securevote_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `demo_voter_id` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `mobile_number` VARCHAR(25) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('VOTER', 'ADMIN') NOT NULL DEFAULT 'VOTER',
  `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `preferred_language` VARCHAR(5) NOT NULL DEFAULT 'en',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_approval` (`approval_status`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_voter_id` (`demo_voter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ELECTIONS TABLE
CREATE TABLE IF NOT EXISTS `elections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `status` ENUM('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'RESULTS_PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `created_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`),
  INDEX `idx_elections_status` (`status`),
  INDEX `idx_elections_times` (`start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS `candidates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `election_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `fictional_party_name` VARCHAR(150) NOT NULL,
  `symbol` VARCHAR(50) NOT NULL,
  `manifesto` TEXT NOT NULL,
  `image_reference` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'withdrawn') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE CASCADE,
  INDEX `idx_candidates_election` (`election_id`),
  INDEX `idx_candidates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VOTER_ELECTIONS TABLE (Participation tracking for duplicate-voting prevention)
CREATE TABLE IF NOT EXISTS `voter_elections` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `voter_id` INT NOT NULL,
  `election_id` INT NOT NULL,
  `has_voted` TINYINT(1) NOT NULL DEFAULT 0,
  `voted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`voter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_voter_election` (`voter_id`, `election_id`),
  INDEX `idx_voter_elections_voted` (`election_id`, `has_voted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BALLOTS TABLE (Separate ballot storage - No direct voter_id link)
CREATE TABLE IF NOT EXISTS `ballots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `election_id` INT NOT NULL,
  `candidate_id` INT NOT NULL,
  `ballot_reference` VARCHAR(64) NOT NULL UNIQUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON DELETE CASCADE,
  INDEX `idx_ballots_election_candidate` (`election_id`, `candidate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. AUDIT_LOGS TABLE (Cryptographic SHA-256 Hash Chaining)
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` INT DEFAULT NULL,
  `election_id` INT DEFAULT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `event_data` TEXT DEFAULT NULL,
  `previous_hash` VARCHAR(64) NOT NULL,
  `current_hash` VARCHAR(64) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE SET NULL,
  INDEX `idx_audit_logs_event_type` (`event_type`),
  INDEX `idx_audit_logs_election` (`election_id`),
  INDEX `idx_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SECURITY_EVENTS TABLE
CREATE TABLE IF NOT EXISTS `security_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'LOW',
  `description` TEXT NOT NULL,
  `resolution_status` ENUM('OPEN', 'INVESTIGATING', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_security_severity` (`severity`),
  INDEX `idx_security_status` (`resolution_status`),
  INDEX `idx_security_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RESULT_PUBLICATIONS TABLE (Controlled result release tracking)
CREATE TABLE IF NOT EXISTS `result_publications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `election_id` INT NOT NULL UNIQUE,
  `published_by` INT NOT NULL,
  `publication_status` ENUM('PUBLISHED', 'REVOKED') NOT NULL DEFAULT 'PUBLISHED',
  `published_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`published_by`) REFERENCES `users`(`id`),
  INDEX `idx_results_published` (`election_id`, `publication_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SYSTEM_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
