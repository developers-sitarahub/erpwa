<div align="center">
  <h1>🟢 ERPWA</h1>
  <p><strong>Enterprise Resource Planning for WhatsApp</strong></p>
  <p>A multi-tenant SaaS platform bridging CRM capabilities, automated workflows, and bulk marketing campaigns directly with the Meta WhatsApp Business API.</p>
</div>

<br />

## 📖 Table of Contents
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Creating the Super Admin](#-creating-the-super-admin)
- [The "Unlimited" SaaS Plan](#-the-unlimited-saas-plan)
- [Core Architecture](#-core-architecture)
- [Deployment Guidelines](#-deployment-guidelines)

---

## 🛠 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS** (v4) & **Framer Motion**
- **React Flow** (For the visual chatbot builder)
- **Socket.io-client** (Real-time inbox sync)

### Backend
- **Node.js & Express.js**
- **PostgreSQL** with **Prisma ORM**
- **Redis & BullMQ** (For queuing high-volume WhatsApp campaigns)
- **Socket.io** (WebSockets for live chat)
- **AWS S3** (Media and template storage)
- **Razorpay** (SaaS subscription billing)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your local machine or server:
- **Node.js** (v18.x or higher)
- **PostgreSQL** (v14+ running locally or remotely)
- **Redis** (Required for BullMQ campaign workers)

---

## 🚀 Installation & Setup

### 1. Environment Variables
Both the frontend and backend require strict environment configurations. We have provided `.env.example` templates in both directories.

```bash
# In the backend directory
cd erpwa-backend
cp .env.example .env

# In the frontend directory
cd ../erpwa-frontend
cp .env.example .env.local
```
> **Note:** Open the newly created `.env` files and populate them with your actual database credentials, Razorpay keys, and Meta API tokens.

### 2. Backend Initialization
Initialize the database and start the API server and workers.

```bash
cd erpwa-backend

# Install dependencies
npm install

# Generate Prisma client and sync schema to PostgreSQL
npx prisma generate
npx prisma db push

# Start the server (starts Express on port 5000 + BullMQ workers)
npm run dev
```

### 3. Frontend Initialization
In a separate terminal window, start the Next.js client.

```bash
cd erpwa-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The application will now be available at `http://localhost:3000`.

---

## 👑 Creating the Super Admin

For security reasons, there is no public sign-up page for the SaaS platform owner. You must initialize the root **Super Admin** via the backend CLI.

Run the following command inside the `erpwa-backend` directory:
```bash
npm run create:super-admin
```
Follow the interactive prompts to set your Name, Email, and Password. Once created, you can log into the master dashboard at `http://localhost:3000/admin-login`.

---

## ♾️ The "Unlimited" SaaS Plan

When configuring subscription plans via the Super Admin dashboard or directly in the database (`SubscriptionPlan` table), you can grant vendors truly unlimited access to resources (templates, conversations, galleries).

**How it works:**
Set the resource limits to exactly `-1`. 
- e.g., `conversationLimit: -1`, `templateLimit: -1`
The backend middleware explicitly recognizes `-1` as the "Unlimited" flag and will bypass all API throttling and quota checks for any Vendor subscribed to that plan.

---

## 🏗 Core Architecture

### WhatsApp Webhooks (`/webhook`)
All inbound messages and delivery receipts arrive via Webhooks from Meta. The backend verifies the payload, stores the message in PostgreSQL, and instantly emits a `message_received` or `message_status_update` event via Socket.io to update the frontend UI without refreshing.

### Campaign Queue (BullMQ)
When a vendor schedules a broadcast to thousands of leads, hitting the Meta API directly in a loop would trigger `429 Too Many Requests` errors. Instead, the backend pushes jobs into a **Redis Queue**. The `whatsapp.worker.js` safely processes these jobs concurrently, respecting Meta's rate limits, and dynamically resolving template variables.

### SaaS Billing
Payments are handled via **Razorpay**. When a checkout completes on the frontend, Razorpay triggers the `/api/subscription/webhook` endpoint. The backend verifies the cryptographic signature (`RAZORPAY_WEBHOOK_SECRET`) and updates the `VendorSubscription` status to active.

---

## 🌍 Deployment Guidelines

1. **Frontend (Vercel):** Ideal for edge caching. Connect your GitHub repository and set the `NEXT_PUBLIC_API_URL` to your production backend.
2. **Backend (AWS EC2 / VPS):**
   - Must be a persistent Node.js process (use **PM2**).
   - Use **Nginx** as a reverse proxy. *Crucially, ensure Nginx is configured to upgrade HTTP headers to support WebSockets (`proxy_set_header Upgrade $http_upgrade;`).*
3. **Database:** Use a managed PostgreSQL instance (e.g., AWS RDS, Supabase) for automated backups.
4. **Meta Developer Portal:** Ensure your production backend URL (`https://api.yourdomain.com/webhook`) is registered in your Meta App Dashboard with your custom `WHATSAPP_VERIFY_TOKEN`.
