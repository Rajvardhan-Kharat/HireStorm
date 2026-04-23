# HireStorm — The Complete Internship & Early Career Platform

HireStorm is a comprehensive, full-stack platform designed to bridge the gap between fresh tech talent and leading companies in India. Moving beyond traditional job boards, HireStorm provides a complete end-to-end ecosystem: from sourcing roles and upskilling, to competing in hackathons, and managing the 90-day internship lifecycle directly on the platform.

The application serves three primary portals seamlessly: **Student/Intern Portal**, **Company/ATS Portal**, and **Platform Admin Portal**.

---

## 🌟 Core Features by Role

### 👨‍🎓 For Students & Interns (Student Portal)
- **Profile & Resume Building:** Rich profiles with custom bios, education history, dynamic skill tagging, social links (LinkedIn, GitHub, Portfolio), and visual "Profile Completeness" strength meters.
- **Job & Internship Board:** Browse 500+ verified listings with advanced filtering. Clear indicators for stipend amounts, remote flexibility, and required skills.
- **Application Tracking:** Kanban-style pipeline (Applied → Shortlisted → Interview → Offer → Rejected) to track the real-time status of all submitted applications.
- **Hackathons & Competitions:** View upcoming/ongoing hackathons, form teams, submit projects, and compete for prize pools.
- **Course Enrollment (LMS):** Skill-up with curated e-learning courses, track enrollment, and boost employability.
- **HireStorm PRO Subscription:** Upgrade via Razorpay to instantly access priority shortlisting, profile highlights, early access to listings, and application analytics.
- **Internship Lifecycle Management (ILM):** *For hired interns only.* A fully gamified 90-day internship tracker. Submit Daily Logs, receive Mentor continuous assessment (CA) scores, participate in Daily Check-ins, manage Work Breakdown Structures (WBS), and generate verifiable final certificates.

### 🏢 For Companies (Company Portal & ATS)
- **Verified Company Profiles:** Branded company pages detailing industry, vision, and verified status to build trust with candidates.
- **Listing Management:** Create and publish complex Job/Internship listings with wizards (specifying stipends, durations, remote work, robust skill/perk tags). One-click pause/activate toggles.
- **Applicant Tracking System (ATS):** Manage incoming applicants on a visual pipeline. Move applicants between states (Shortlist, Interview, Reject) with a single click. Review comprehensive candidate cards featuring cover letters, matching skills, and education context.
- **Candidate Database:** A globally searchable database of all unique candidates who have applied to your company, preventing duplicates and enabling deep search by skill or name.

### 🛡️ For Platform Administrators (Admin Portal)
- **User Management:** Complete overview of all platform users. Instantly modify user roles (escalate to MENTOR, COMPANY_ADMIN, or PRO_STUDENT) and monitor growth metrics.
- **Company Verification:** Approve or reject pending company registrations to maintain high platform quality. Includes rejection reasoning workflows.
- **ILM Oversight:** Global dashboard tracking the progress of every active internship. Monitor day 1 to 90 progression, active CA scores, and resolve pending or terminated internships.
- **Total Ecosystem CMS:** (Coming Soon) Manage all Hackathons, Courses, and Financial Transactions from a centralized interface.

---

## 🏗️ Technical Architecture & Stack

HireStorm is a modular Monorepo encompassing a modern Javascript/Typescript stack.

### Frontend 
- **Framework:** React + Vite
- **Routing:** React Router DOM (v6)
- **State Management:** Zustand (for Auth, Theme, and Notification stores)
- **Styling:** Custom CSS Design System featuring a warm navy aesthetic (`#0f1623`), modern typography (`Plus Jakarta Sans`), glassmorphism cards, and fluid skeleton loading animations.
- **Icons & Visuals:** Lucide React

### Backend 
- **Framework:** Node.js + Express.js
- **Database:** MongoDB + Mongoose (robust schemas for `User`, `Company`, `Listing`, `Application`, `Internship`, `Hackathon`, `Course`, `DailyLog`).
- **Authentication:** JWT (JSON Web Tokens) with short-lived Access Tokens and secure `httpOnly` cookie Refresh Tokens. 
- **Payments:** Razorpay API integration (handling Subscription Upgrades and transaction tracking).
- **Communication:** Socket.IO for real-time notifications and SendGrid for email delivery.
- **File Storage:** Cloudinary for avatar, company logo, and file (resume/submission) uploads.

---

## 🗄️ Database Models Overview

- **User:** Handles authentication, profiles, role-based access control (RBAC), and subscription states.
- **Company:** Contains brand details, industry, and Admin verification statuses (`PENDING`, `APPROVED`, `REJECTED`).
- **Listing:** Maps a company to a specific role (Job/Internship) including required skills, stipend details, deadlines, and active state.
- **Application:** Links a `User` to a `Listing` with states mapping the entire hiring pipeline.
- **Internship (ILM):** The core lifecycle object created after hiring. Tracks the 90-day progress, continuous assessment (CA) score, Mentor linking, and certification thresholds.
- **DailyLog & CheckIn:** Child models for the ILM tracking daily tasks, blockers, and mentor evaluations.
- **Hackathon, Team & Submission:** Facilitates competitive programming and complex problem statements.
- **Course:** Standalone content management mapping to user course enrollments.
- **Notification:** Global multi-type notification system tracking system, hackathon, and application alerts.
- **Transaction:** Standardized tracking for Razorpay payload responses securing payment data.

---

## 🚀 Running the Project Locally

### 1. Requirements
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)
- Redis (Optional, if configured for caching)

### 2. Backend Setup
```bash
cd backend
npm install
```
- Define `.env` mapping variables for `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RAZORPAY_KEY`, etc.
- To seed the admin account, run:
```bash
node seedAdmin.js
```
- **Start the server:**
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```
- Map `VITE_API_URL` to your backend url (usually `http://localhost:5000/api/v1`).
- **Start the client:**
```bash
npm run dev
```

---
*Built to redefine Early Career Hiring and Training in the Tech Industry.*
