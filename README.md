# SecureVote — Secure Online Voting Prototype

> **Strict Disclaimer:** This application is strictly an **educational prototype** using fictional voters, fictional candidates, and simulated election data. It must **not** be represented as certified, legally authorized, or suitable for conducting real public or government elections.

---

## 1. Project Overview

**SecureVote** is a full-stack, bilingual online voting simulation web application engineered to model modern democratic election processes while upholding foundational cybersecurity principles. It simulates the lifecycle of democratic elections with cryptographic tamper-evident audit logging, ballot anonymity preservation, database-level duplicate-voting prevention, administrative oversight, and live election monitoring.

The application features a soft, elegant **Baby Blue / Light Blue** design system and comprehensive bilingual support in **English** and **Tamil (தமிழ்)** across all pages, forms, notifications, modals, and error states.

---

## 2. Key Features

- **Voter Registration & Demo Verification:** Simulated voter registration with duplicate checks on Email and Demo Voter ID, password hashing with `bcrypt`, and simulated demo OTP verification.
- **Role-Based Access Control (RBAC):** Server-enforced roles (`VOTER` and `ADMIN`) with session regeneration on login, secure HttpOnly cookies, SameSite enforcement, and CSRF protection on state-changing endpoints.
- **Duplicate-Voting Prevention:** Multi-layered defense combining frontend guidance, server-side eligibility checks, and database-level `UNIQUE(voter_id, election_id)` constraints inside atomic SQL transactions.
- **Decoupled Anonymous Balloting:** Voter participation records (`voter_elections`) and cast ballots (`ballots`) are stored in distinct decoupled tables with randomized cryptographic confirmation references (`BAL-EXXX-XXX`) to prevent direct database linkage between a voter's identity and their candidate selection.
- **Admin-Only Live Election Monitoring:** Real-time polling monitoring dashboard with two configurable oversight policies:
  - **Policy B (Default):** Turnout metrics only during voting; candidate-wise tallies remain confidential until official election closing to prevent voter bandwagon effects.
  - **Policy A (Simulation Mode):** Live candidate-wise tallies and leader projections displayed during voting for demonstration purposes.
- **Controlled Results Publication:** Prevents unauthorized or premature leak of results. Concluded elections require explicit administrative consistency verification (matching stored ballots with participation records) before certification and public release. Includes automatic **Tie Handling**.
- **Tamper-Evident SHA-256 Audit Chaining:** Every administrative action, voter approval, status change, and ballot issuance is cryptographically linked in a verifiable hash chain with genesis anchoring. An interactive verification tool allows administrators to recompute and verify all blocks in real time.
- **Security Incident Oversight:** Centralized logging and resolution management for failed logins, duplicate voting attempts, rate-limit triggers, and anomalous API access.
- **Bilingual Experience (English & Tamil):** Instant, non-reloading language switching between English and Tamil (தமிழ்), with locale-aware calendar, time, and number formatting (`en-IN` / `ta-IN`), persisted in `localStorage` for guests and database/session for authenticated users.

---

## 3. Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Baby Blue Design System Tokens), Vanilla JavaScript (ES6+), Fetch API, Google Fonts (Outfit, Inter, Noto Sans Tamil).
- **Backend:** Node.js, Express.js.
- **Database:** MySQL / MariaDB (connected via `mysql2/promise` with connection pooling and transactions), UTF8MB4 charset for full Tamil Unicode compatibility.
- **Security & Cryptography:** `bcryptjs` (password hashing), Node.js `crypto` (SHA-256 audit chaining & ballot UUIDs), `express-session`, `helmet` (security headers & CSP), `express-rate-limit`, CSRF token validation.
- **Testing:** Node.js built-in test runner (`node:test`, `node:assert`) and `supertest`.

---

## 4. Prerequisites

1. **Node.js:** v18.0.0 or higher (v20+ or v24 recommended).
2. **npm:** v9.0.0 or higher.
3. **MySQL or MariaDB:** (e.g. XAMPP MySQL or standalone MySQL Server running on port 3306).

---

## 5. Installation & Setup

### Step 1: Clone or Navigate to Project Directory
```bash
cd "c:\Users\JAISHREE A P\OneDrive\Desktop\securevote"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Copy the example environment file or create `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=securevote_db
SESSION_SECRET=securevote_educational_sim_super_secure_random_key_2026_demo
```
*(If your local MySQL root user has a password, enter it in `DB_PASSWORD`)*.

### Step 4: Initialize Database & Seed Data
Execute the automated database initialization script:
```bash
npm run db:setup
```
This script will:
1. Connect to MySQL and create the `securevote_db` database with `utf8mb4_unicode_ci`.
2. Execute `database/schema.sql` creating all tables, indexes, and constraints.
3. Apply `database/seed.sql` populating pre-configured fictional demo accounts and elections.
4. Calculate and link valid SHA-256 cryptographic hashes for the initial audit log genesis chain.

---

## 6. Running the Application

### Start the Server:
```bash
npm start
```
Or run with file watching for development:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 7. Pre-Configured Demo Credentials

The database comes pre-loaded with fictional demo accounts ready for evaluation:

| Role | Name | Email / Identifier | Password | Status / Language |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Dr. K. Senthil Kumar (Chief Election Officer) | `admin@securevote.demo` | `AdminPassword@123` | Approved • English |
| **VOTER** | Aarav Sharma | `aarav@securevote.demo` *(or `DEMO-VOTER-101`)* | `VoterPassword@123` | Approved • Voted in Election 1 |
| **VOTER** | Priya Ramanathan | `priya@securevote.demo` *(or `DEMO-VOTER-102`)* | `VoterPassword@123` | Approved • Ready to Vote • Tamil |
| **VOTER** | Kavitha Sundaram | `kavitha@securevote.demo` *(or `DEMO-VOTER-103`)* | `VoterPassword@123` | Approved • Ready to Vote • Tamil |
| **VOTER** | Meenakshi Natarajan | `meenakshi@securevote.demo` *(or `DEMO-VOTER-104`)* | `VoterPassword@123` | **Pending Approval** (Demo review) |
| **VOTER** | Vikram Chandrasekar | `vikram@securevote.demo` *(or `DEMO-VOTER-105`)* | `VoterPassword@123` | Approved • English |

*(Note: The login page includes **one-click fill buttons** to instantly populate these credentials).*

---

## 8. Demo Election Scenarios Included in Seed Data

1. **Election #1 — "2026 Metropolis Student Council Election"**
   - **Status:** `OPEN` (Active)
   - **Candidates:** Aditi Venkataraman (Future Harmony), Rajesh Balasubramanian (Digital Progress), Deepa Swaminathan (Eco Sustainability).
   - **Usage:** Log in as Priya (`priya@securevote.demo`) to cast a ballot, review the candidate manifesto, confirm the vote, and receive an anonymous ballot reference. Log in as Aarav (`aarav@securevote.demo`) to observe duplicate-voting prevention.
2. **Election #2 — "Civic Innovation Board Simulation 2026"**
   - **Status:** `CLOSED` (Unpublished)
   - **Usage:** Log in as Admin (`admin@securevote.demo`) and navigate to **Results Release** (`results-management.html`) to perform data consistency checks and certify publication. Observe that public users cannot view candidate totals until published.
3. **Election #3 — "2025 State Youth Assembly Simulation"**
   - **Status:** `RESULTS_PUBLISHED`
   - **Usage:** Concluded election with certified public results, winner declaration, and vote share progress meters (`results.html`).
4. **Election #4 — "Upcoming Smart Community Initiative 2027"**
   - **Status:** `SCHEDULED` (Future)
   - **Usage:** Demonstrates that voting is prevented before an election officially opens.

---

## 9. Running the Automated Test Suite

SecureVote includes an automated test suite covering all **20 mandatory verification requirements** specified in the design document:

```bash
npm test
```

### Verified Test Cases:
1. **Voter registration validation** (missing fields, invalid emails, short passwords, terms check).
2. **Password hashing** (verifies bcrypt hashing and confirms plain-text passwords are never saved).
3. **Successful login** (via email or Demo Voter ID).
4. **Failed login** (verifies generic authentication error messages that do not leak user existence).
5. **Session authorization** (`/api/auth/me` and session invalidation on logout).
6. **Voter cannot access admin endpoints** (verifies strict 403 Forbidden RBAC).
7. **Admin can access management endpoints** (elections, voters, audit logs, analytics).
8. **Duplicate voting prevention** (verifies unique database constraints and rollback on repeat vote).
9. **Voting before election opening is rejected** (SCHEDULED election protection).
10. **Voting after election closing is rejected** (CLOSED election protection).
11. **Invalid candidate selection is rejected** (verifies candidate belongs to the active election).
12. **Concurrent vote submissions are handled safely** (simultaneous race condition handling).
13. **Public users cannot retrieve live results** (401 unauthenticated check).
14. **Voters cannot retrieve admin-only live results** (403 forbidden check).
15. **Results remain unpublished until approved** (403 results not published check).
16. **Results become public only after publication** (verifies public release post-certification).
17. **Audit hash-chain verification** (recalculates SHA-256 chain and detects database block tampering).
18. **Bilingual translation dictionary parity** (matching keys between `en.json` and `ta.json`, valid Tamil Unicode).
19. **Language preference persistence** (session synchronization and database field update).
20. **Invalid input handling** (sanitization and malformed payload rejection).

---

## 10. End-to-End Walkthrough Demonstration

### A. Voter Walkthrough:
1. Open `http://localhost:3000` and switch between English and தமிழ் using the top right toggle.
2. Click **Access Voter Portal** (`/login.html`).
3. Click the **Voter (Approved): priya@securevote.demo** button to pre-fill credentials and click **Sign In**.
4. On the **Voter Dashboard** (`/voter-dashboard.html`), view active elections and click **Proceed to Ballot** on Election #1.
5. On the **Ballot Page** (`/ballot.html`), click a candidate card (e.g. *Aditi Venkataraman*), click **Read Full Manifesto** to inspect platform pledges, and click **Review My Selection**.
6. Review the ballot summary in the confirmation modal and click **Confirm & Submit Vote**.
7. Receive your unique anonymous receipt reference (e.g., `BAL-E1-M1K...`).
8. Navigate to **Voting Status** (`/voting-status.html`) to verify that participation is logged while your candidate choice remains secret.
9. Attempting to vote again on the same election will immediately be rejected by database constraints.

### B. Admin Walkthrough:
1. Log in as `admin@securevote.demo` (`AdminPassword@123`).
2. Explore the **Chief Election Administrator Overview** (`/admin-dashboard.html`).
3. Open **Live Monitoring** (`/live-monitoring.html`) to observe real-time turnout metrics auto-refreshing every 10 seconds.
4. Toggle between **Policy B** (Confidential counts) and **Policy A** (Live candidate counts displayed) to demonstrate policy governance.
5. Go to **Voters & Approvals** (`/voter-management.html`) to review pending voter *Meenakshi Natarajan* and click **Approve Voter**.
6. Go to **Results Release** (`/results-management.html`), select Election #2 (Closed), observe the automated 100% ballot reconciliation match, and click **Authorize & Publish Official Results**.
7. Navigate to **Audit Chain** (`/audit-logs.html`) and click **Run SHA-256 Chain Verification** to mathematically verify that all blocks from genesis are uncompromised.

---

## 11. Architecture & Design System

### Design System Color Tokens:
- **Baby Blue:** `#BFE6FF`
- **Light Blue:** `#DDF3FF`
- **Soft Sky Blue:** `#EAF7FF`
- **Primary Blue:** `#5AADEB` (Primary Buttons, Active Accents)
- **Deep Blue:** `#2477B8` (Button Hover, Section Titles)
- **Navy Text:** `#173B57`
- **Main Background:** `#F4FAFF`
- **Card Background:** `#FFFFFF` (12–18px rounded borders, subtle elevation)
- **Status Colors:** Success `#2E8B67`, Warning `#D99A28`, Error `#D9534F`

### Database Architecture (`securevote_db`):
- `users`: Credentials, role (`VOTER`, `ADMIN`), approval status, preferred language.
- `elections`: Title, schedule, state (`DRAFT`, `SCHEDULED`, `OPEN`, `CLOSED`, `RESULTS_PUBLISHED`).
- `candidates`: Name, fictional party, symbol, manifesto, active status.
- `voter_elections`: Participation tracking with `UNIQUE(voter_id, election_id)`.
- `ballots`: Anonymized ballot storage with `ballot_reference` (No direct `voter_id`).
- `audit_logs`: SHA-256 chained event log with `previous_hash` and `current_hash`.
- `security_events`: Incident surveillance for failed logins, duplicate attempts, rate limits.
- `result_publications`: Audit certifications for approved results release.
- `system_settings`: Policy settings (`monitoring_policy`, `require_voter_approval`).

---

## 12. Security Limitations Note

1. **Ballot Anonymity Limitation:** Storing voter participation (`voter_elections`) and ballots (`ballots`) in separate tables reduces direct linkage in standard queries. However, this does not mathematically guarantee zero-knowledge ballot secrecy. Database administrators with direct access to database transaction logs, physical drive backups, or high-resolution server timestamps could theoretically reconstruct correlation.
2. **Hash Chaining Scope:** Cryptographic SHA-256 hash chaining makes unauthorized application-level tampering immediately detectable. However, if an attacker obtains full root access to the database server and server keys, they could theoretically recalculate the entire chain.
3. **Educational Prototype:** This system is built strictly for instructional, educational, and academic simulation purposes.

---

## 13. License

This project is licensed under the MIT License for educational demonstration and academic research.
