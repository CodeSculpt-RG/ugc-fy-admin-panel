# UGC FY — Admin Console
## Product Requirements Document (PRD)
**Version:** 1.0
**Status:** Draft
**Type:** Enterprise Internal Operations & Moderation Platform

---

### 1. Product Overview
UGC FY Admin Console is the centralized operational control system for the UGC FY creator-brand marketplace ecosystem. It provides real-time control over creators, brands, campaigns, payments, moderation, and analytics.

### 2. Product Goals
- **Marketplace Governance:** Complete control over platform activities.
- **Financial Operations:** Secure management of payments, payouts, and escrow.
- **Trust & Safety:** Maintain marketplace integrity through content moderation.
- **Admin Collaboration:** Internal team management with role-based access.
- **Scalability:** Built for enterprise-level growth.

### 3. Core Features
- **User Management:** Detailed profiles for Creators and Brands.
- **Campaign Management:** Tracking and moderation of marketplace campaigns.
- **Content Moderation:** AI and manual review queues for videos, images, and text.
- **Payment & Escrow:** Milestone-based payout system with automated escrow.
- **Dispute Resolution:** Tools to handle marketplace conflicts.
- **Analytics & Reporting:** Comprehensive data visualization for all operations.
- **Admin Management:** Invite and manage internal staff with specific roles.

### 4. Role-Based Access Control (RBAC)
- **Super Admin:** Full platform access.
- **Moderation Admin:** Content review and user suspensions.
- **Finance Admin:** Payment releases and refund handling.
- **Support Admin:** Dispute resolution and user support.
- **Analyst:** Read-only access to analytics and reports.

### 5. Technical Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
- **UI Components:** ShadCN UI, Framer Motion.
- **State Management:** Zustand.
- **Charts:** Recharts.
- **Tables:** TanStack Table.
- **Backend:** Node.js, Express.
- **Database:** PostgreSQL, Supabase.

### 6. Security Requirements
- **Authentication:** Email + Password (INTERNAL ONLY).
- **Session Management:** JWT-based sessions.
- **Access Control:** Restricted `/admin/login` route.
- **Audit Logs:** Tracking of all critical admin actions.

---
*Created by Antigravity AI*
