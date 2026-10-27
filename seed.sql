-- =======================================================
-- SecureVote — Fictional Seed Data Script
-- Strictly Educational Prototype Data
-- =======================================================

USE `securevote_db`;

-- Clear existing data in correct FK order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `result_publications`;
TRUNCATE TABLE `security_events`;
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `ballots`;
TRUNCATE TABLE `voter_elections`;
TRUNCATE TABLE `candidates`;
TRUNCATE TABLE `elections`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `system_settings`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. SYSTEM SETTINGS
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_by`) VALUES
('monitoring_policy', 'POLICY_B', NULL),
('require_voter_approval', 'true', NULL),
('demo_otp_verification', 'true', NULL);

-- 2. USERS (Admin & Fictional Voters)
-- Passwords:
-- AdminPassword@123 -> $2a$10$HI4SLzKYeDhCbblbVo3f5ON0kA6zPyopV41M2l3CFEbiNOwI6shx6
-- VoterPassword@123 -> $2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC

INSERT INTO `users` (`id`, `full_name`, `demo_voter_id`, `email`, `mobile_number`, `password_hash`, `role`, `approval_status`, `preferred_language`, `created_at`) VALUES
(1, 'Dr. K. Senthil Kumar (Chief Election Officer)', 'DEMO-ADM-001', 'admin@securevote.demo', '+91 98765 00001', '$2a$10$HI4SLzKYeDhCbblbVo3f5ON0kA6zPyopV41M2l3CFEbiNOwI6shx6', 'ADMIN', 'approved', 'en', NOW() - INTERVAL 10 DAY),
(2, 'Aarav Sharma', 'DEMO-VOTER-101', 'aarav@securevote.demo', '+91 98765 10001', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'approved', 'en', NOW() - INTERVAL 9 DAY),
(3, 'Priya Ramanathan', 'DEMO-VOTER-102', 'priya@securevote.demo', '+91 98765 10002', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'approved', 'en', NOW() - INTERVAL 8 DAY),
(4, 'Kavitha Sundaram', 'DEMO-VOTER-103', 'kavitha@securevote.demo', '+91 98765 10003', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'approved', 'en', NOW() - INTERVAL 7 DAY),
(5, 'Meenakshi Natarajan', 'DEMO-VOTER-104', 'meenakshi@securevote.demo', '+91 98765 10004', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'pending', 'en', NOW() - INTERVAL 1 DAY),
(6, 'Vikram Chandrasekar', 'DEMO-VOTER-105', 'vikram@securevote.demo', '+91 98765 10005', '$2a$10$q5rEjIfiABJ9ePpYL.VEsO.nDAjQrnjVBY2VEcDLQS5mCHISHP2qC', 'VOTER', 'approved', 'en', NOW() - INTERVAL 6 DAY);

-- 3. ELECTIONS
INSERT INTO `elections` (`id`, `title`, `description`, `start_time`, `end_time`, `status`, `created_by`, `created_at`) VALUES
(1, '2026 Metropolis Student Council Election', 'Simulated democratic election for the student council presidency and representative body. Open for all verified demo student voters.', NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY, 'OPEN', 1, NOW() - INTERVAL 5 DAY),
(2, 'Civic Innovation Board Simulation 2026', 'Election simulation for electing community leads for municipal tech and sustainability projects.', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 HOUR, 'CLOSED', 1, NOW() - INTERVAL 7 DAY),
(3, '2025 State Youth Assembly Simulation', 'Fictional youth assembly election simulation concluded last year with certified results.', NOW() - INTERVAL 30 DAY, NOW() - INTERVAL 20 DAY, 'RESULTS_PUBLISHED', 1, NOW() - INTERVAL 35 DAY),
(4, 'Upcoming Smart Community Initiative 2027', 'Future scheduling simulation for upcoming technological and infrastructure advisory committee.', NOW() + INTERVAL 7 DAY, NOW() + INTERVAL 10 DAY, 'SCHEDULED', 1, NOW() - INTERVAL 2 DAY);

-- 4. CANDIDATES
INSERT INTO `candidates` (`id`, `election_id`, `name`, `fictional_party_name`, `symbol`, `manifesto`, `image_reference`, `status`) VALUES
(1, 1, 'Aditi Venkataraman', 'Future Harmony Party', '📖 Book & Torch', 'Advancing digital campus accessibility, 24/7 AI tutor hubs, student health insurance reform, and transparent campus fund allocation.', '/assets/candidate-aditi.svg', 'active'),
(2, 1, 'Rajesh Balasubramanian', 'Digital Progress Alliance', '💻 Laptop & Gear', 'Modernizing computer science laboratories, high-speed fiber across dorms, incubator grants for student startups, and open hardware lending.', '/assets/candidate-rajesh.svg', 'active'),
(3, 1, 'Deepa Swaminathan', 'Eco Sustainability League', '🌿 Green Leaf & Tree', 'Transitioning campus cafes to 100% zero single-use plastics, rooftop solar installations, and organic community gardens.', '/assets/candidate-deepa.svg', 'active'),
(4, 2, 'Karthik Annamalai', 'Civic Innovation Forum', '🕯️ Beacon of Light', 'Municipal open data standards, smart traffic sensors, and community civic dashboards.', '/assets/candidate-karthik.svg', 'active'),
(5, 2, 'Ananya Srinivasan', 'Urban Welfare Front', '🤝 Open Hands', 'Pedestrian-friendly green corridors, accessible public transit, and youth community centers.', '/assets/candidate-ananya.svg', 'active'),
(6, 3, 'Siddharth Mohan', 'Youth Empowerment Guild', '🌅 Rising Sun', 'Championing affordable apprenticeships, mental health support lines, and sports infrastructure.', '/assets/candidate-siddharth.svg', 'active'),
(7, 3, 'Gayathri Murali', 'Alliance for Tomorrow', '🧭 Golden Compass', 'Focusing on clean energy incubation, rural digital bridges, and skill retraining programs.', '/assets/candidate-gayathri.svg', 'active');

-- 5. VOTER ELECTIONS & BALLOTS (For simulated elections)
-- Voter 2 (Aarav) has voted in Election 1
INSERT INTO `voter_elections` (`voter_id`, `election_id`, `has_voted`, `voted_at`) VALUES
(2, 1, 1, NOW() - INTERVAL 3 HOUR);

-- Ballot for Election 1 (Separated, no voter_id!)
INSERT INTO `ballots` (`election_id`, `candidate_id`, `ballot_reference`, `created_at`) VALUES
(1, 1, 'BAL-2026-E1-a8f9c1b3d4e5f607', NOW() - INTERVAL 3 HOUR);

-- Election 2 (CLOSED, unapproved publication for demo)
-- Voters 2, 3, 4 participated
INSERT INTO `voter_elections` (`voter_id`, `election_id`, `has_voted`, `voted_at`) VALUES
(2, 2, 1, NOW() - INTERVAL 2 DAY),
(3, 2, 1, NOW() - INTERVAL 1 DAY),
(4, 2, 1, NOW() - INTERVAL 1 DAY);

INSERT INTO `ballots` (`election_id`, `candidate_id`, `ballot_reference`, `created_at`) VALUES
(2, 4, 'BAL-2026-E2-1111222233334444', NOW() - INTERVAL 2 DAY),
(2, 4, 'BAL-2026-E2-5555666677778888', NOW() - INTERVAL 1 DAY),
(2, 5, 'BAL-2026-E2-9999aaaabbbbcccc', NOW() - INTERVAL 1 DAY);

-- Election 3 (RESULTS_PUBLISHED)
INSERT INTO `voter_elections` (`voter_id`, `election_id`, `has_voted`, `voted_at`) VALUES
(2, 3, 1, NOW() - INTERVAL 25 DAY),
(3, 3, 1, NOW() - INTERVAL 25 DAY),
(4, 3, 1, NOW() - INTERVAL 24 DAY),
(6, 3, 1, NOW() - INTERVAL 24 DAY);

INSERT INTO `ballots` (`election_id`, `candidate_id`, `ballot_reference`, `created_at`) VALUES
(3, 6, 'BAL-2025-E3-a1b2c3d4e5f60001', NOW() - INTERVAL 25 DAY),
(3, 6, 'BAL-2025-E3-a1b2c3d4e5f60002', NOW() - INTERVAL 25 DAY),
(3, 6, 'BAL-2025-E3-a1b2c3d4e5f60003', NOW() - INTERVAL 24 DAY),
(3, 7, 'BAL-2025-E3-a1b2c3d4e5f60004', NOW() - INTERVAL 24 DAY);

-- Publication record for Election 3
INSERT INTO `result_publications` (`election_id`, `published_by`, `publication_status`, `published_at`) VALUES
(3, 1, 'PUBLISHED', NOW() - INTERVAL 20 DAY);

-- 6. SECURITY EVENTS
INSERT INTO `security_events` (`id`, `user_id`, `event_type`, `severity`, `description`, `resolution_status`, `created_at`) VALUES
(1, NULL, 'FAILED_LOGIN_ATTEMPT', 'LOW', 'Failed login attempt for unknown identifier "test_user_guest" from 127.0.0.1', 'RESOLVED', NOW() - INTERVAL 2 DAY),
(2, 2, 'DUPLICATE_VOTE_PREVENTED', 'HIGH', 'Simulated duplicate vote submission attempt on election ID 1 was blocked by database constraints.', 'RESOLVED', NOW() - INTERVAL 2 HOUR),
(3, NULL, 'RATE_LIMIT_TRIGGERED', 'MEDIUM', 'IP address 192.168.1.150 exceeded 10 login requests per minute window. Throttled.', 'RESOLVED', NOW() - INTERVAL 1 DAY);

-- 7. AUDIT LOGS (Genesis & Chain)
-- Generated with SHA-256 chaining
INSERT INTO `audit_logs` (`id`, `actor_id`, `election_id`, `event_type`, `event_data`, `previous_hash`, `current_hash`, `created_at`) VALUES
(1, 1, NULL, 'SYSTEM_INITIALIZATION', '{"description":"SecureVote simulation initialized with genesis cryptographic block"}', '0000000000000000000000000000000000000000000000000000000000000000', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', NOW() - INTERVAL 10 DAY);
