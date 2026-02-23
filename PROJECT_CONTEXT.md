# ERPWA: Project Context & Architecture Guide

> **Generated for AI Assistants & Developers**
> This document provides a comprehensive overview of the ERPWA platform, its architecture, key components, and Unique Selling Propositions (USP). Use this as the primary reference when onboarding new AI agents or developers.

---

## 1. Executive Summary

**ERPWA** (Enterprise Resource Planning & WhatsApp Automation) is a sophisticated B2B SaaS platform designed to bridge the gap between traditional CRM systems and modern conversational commerce. It empowers vendors to manage leads, automate customer interactions via WhatsApp, run marketing campaigns, and visualize complex workflows—all within a single, unified interface.

Unlike generic CRM tools, ERPWA treats **WhatsApp as a first-class citizen**, offering native support for advanced Meta features like interactive Flows, Catalogs, and Carousel templates.

---

## 2. Unique Selling Propositions (USP)

### 🚀 **Native WhatsApp "Superpowers"**

While most competitors only support basic text/image messaging, ERPWA fully integrates advanced Meta Business API features:

- **WhatsApp Flows Support**: Create and deploy native, interactive screens (forms, appointment booking) directly within WhatsApp.
- **Carousel & Catalog Templates**: Send multi-product scrolls and rich media cards, driving higher engagement than standard text.
- **Automated Template Sync**: Real-time synchronization of template statuses (Approved, Rejected) with Meta.

### 🧠 **Dual Workflow Architecture**

ERPWA features a powerful automation engine:

1.  **Internal CRM Workflows**: Automate lead assignments, status updates, and notifications based on triggers.
2.  **Conversational AI Flows**: A visual, node-based builder (ReactFlow) to design sophisticated chatbots that handle customer queries 24/7.

### 🛡️ **Enterprise-Grade Campaign Management**

Built for scale and safety:

- **Smart Queueing**: Uses **BullMQ & Redis** to throttle message sending, preventing WhatsApp number bans due to rate limits.
- **Detailed Analytics**: Real-time tracking of Sent, Delivered, Read, and Failed statuses.
- **Media-Rich Broadcasts**: Support for images, videos, and documents in bulk campaigns.

### 🏢 **True Multi-Tenancy**

Designed for aggregators and agencies:

- **Vendor Isolation**: Strict data segregation ensures one vendor cannot access another's leads or templates.
- **Role-Based Access Control (RBAC)**: Granular permissions for `Vendor Owner`, `Admin`, and `Sales Agent` roles.

---

## 3. Technology Stack

### **Backend (`erpwa-backend`)**

A robust, scalable Node.js monolithic architecture.

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js with ES Modules
- **Database Logic**: Prisma ORM (Type-safe database access)
- **Database**: PostgreSQL (Relational data storage)
- **Caching & Queues**: Redis + BullMQ (For background jobs like campaign sending)
- **Real-time**: Socket.IO (Instant message delivery to frontend)
- **Storage**: AWS S3 (Media, backups)

### **Frontend (`erpwa-frontend`)**

A modern, responsive Single Page Application (SPA) feel using Next.js.

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion (Animations)
- **State Management**: React Context + Hooks
- **Visualizations**: ReactFlow (Workflow builder)

---

## 4. Architecture & Data Flow

### **High-Level Data Flow**

1.  **Inbound Message**:
    `WhatsApp Webhook` -> `Express Route` -> `BullMQ Job` -> `Database Store` -> `Socket.IO Event` -> `Frontend Update`
2.  **Outbound Campaign**:
    `Frontend Trigger` -> `API Endpoint` -> `BullMQ Queue` -> `Worker Process` -> `WhatsApp API` -> `Status Webhook Update`

### **Directory Structure Guide**

#### **Backend Structure (`erpwa-backend/src`)**

| Directory            | Purpose                                                            |
| :------------------- | :----------------------------------------------------------------- |
| `controllers/`       | Request handlers. Business logic resides here.                     |
| `routes/`            | API definition. Maps URLs to controllers.                          |
| `services/`          | Reusable business logic (e.g., `WhatsappService`, `EmailService`). |
| `models/`            | _Managed by Prisma Schema (`prisma/schema.prisma`)_.               |
| `cron/`              | Scheduled tasks (e.g., syncing template statuses).                 |
| `jobs/` & `workers/` | Background processing for heavy tasks (Campaigns).                 |
| `middleware/`        | Auth checks (`verifyToken`), Error handling.                       |

#### **Frontend Structure (`erpwa-frontend/app`)**

| Directory      | Purpose                                                             |
| :------------- | :------------------------------------------------------------------ |
| `(dashboard)/` | Main authenticated area. Contains `inbox`, `campaigns`, `contacts`. |
| `admin/`       | Super-admin specific routes.                                        |
| `components/`  | Reusable UI blocks (Buttons, Inputs, Tables).                       |
| `context/`     | Global state (Auth, Socket connection).                             |
| `lib/`         | Utility functions and API clients (`axios` instance).               |

---

## 5. Core Entities & Database Schema

The database is designed around the **Vendor** as the central tenant.

### **Primary Models**

- **Vendor**: The business entity. Holds API keys (`whatsappAccessToken`, `phoneNumberId`).
- **User**: Employees of the vendor. Linked via `vendorId`.
- **Contact / Lead**: The customers. Can be categorized hierarchically.
- **Conversation**: The chat session. Links a `Lead` to a `Vendor`.
- **Message**: Individual chat bubbles. Supports `text`, `image`, `video`, `template`.
- **Campaign**: Bulk messaging object. Tracks `sent`, `delivered`, `failed` counts.
- **Template**: Mirrors Meta's template structure (Header, Body, Footer, Buttons).
- **Workflow**: Stores the JSON structure of the automation nodes/edges.

---

## 6. Key Implementation Details

1.  **Authentication**: Uses JWT (JSON Web Tokens) with `access` and `refresh` tokens securely stored in cookies.
2.  **WhatsApp Webhook**: A single endpoint (`/webhook`) handles all incoming events (messages, status updates). It verifies the Meta signature before processing.
3.  **Media Handling**: Media is uploaded to S3 first; the URL is then sent to WhatsApp or stored in the database.
4.  **Socket Events**:
    - `message_received`: Updates the chat window instantly.
    - `message_status`: Updates ticks (sent/delivered/read).
    - `campaign_progress`: Live progress bar for bulk sending.

---

## 7. Developer Onboarding: Quick Start

### **Prerequisites**

- Node.js v20+
- PostgreSQL Database
- Redis Server (for BullMQ)

### **Setup Steps**

1.  **Clone Repository**
2.  **Install Dependencies**:
    ```bash
    cd erpwa-backend && npm install
    cd ../erpwa-frontend && npm install
    ```
3.  **Environment Variables**:
    - Populate `.env` in both folders (DB URL, Redis URL, JWT Secrets, AWS Keys).
4.  **Database Migration**:
    ```bash
    cd erpwa-backend
    npx prisma migrate dev
    ```
5.  **Run Development Servers**:
    - Backend: `npm run dev` (Port 5000)
    - Frontend: `npm run dev` (Port 3000)
    - Worker: Ensure `whatsapp.worker.js` is running (usually started with backend).

---

> **Note to AI**: When modifying this codebase, always ensure **Vendor Isolation** is maintained. Never query `Leads` or `Messages` without a `where: { vendorId: ... }` clause.

---

## 8. Frontend Component Library (`erpwa-frontend/components`)

The UI is modularized by feature domain.

### **Core Modules**

- **`inbox/`**: The heart of customer interaction. Contains:
  - `ChatList`: Displays active conversations (Leads).
  - `ChatWindow`: The message thread view.
  - `MessageBubble`: Specific styling for `text`, `image`, `video`, and `template` messages.
  - `Composer`: Input area with attachment support.
- **`chatbot/`**: Components for the visual flow builder.
  - likely contains ReactFlow custom nodes (`StartNode`, `DecisionNode`, `MessageNode`).
- **`campaigns/`**: UI for drafting and monitoring bulk messages.
  - `CampaignWizard`: Steps to select Audience -> Template -> Schedule.
- **`templates/`**: CRUD interface for WhatsApp Templates.
  - `TemplatePreview`: Renders a mock-up of how the message will look on phone screens.
- **`flows/`**: Management of WhatsApp Native Flows.

### **Shared UI Elements**

- **`sidebar.tsx`**: Main navigation (Dashboard, Inbox, CRM, Campaigns). Distinct version for Admin (`sidebar-admin.tsx`).
- **`header.tsx`**: Top bar with Vendor selector, User Profile, Notifications.
- **`ui/`**: Base atomic components (likely Shadcn UI or custom).
