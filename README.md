# ReachInbox — Cold Email Outreach & Staggered Dispatcher 
( https://reachinbox-delta-three.vercel.app )

A high-throughput, automated cold email outreach and staggered sequence dispatching system built with **Next.js 16 (App Router)**, **TypeScript**, **Node.js / Express**, **BullMQ**, **Redis**, **Prisma ORM**, **Elasticsearch**, and **Ethereal Nodemailer**.

---

## 🌟 Key Features

- **Dynamic Sequence Scheduler (No Cron)**: Schedules email jobs as BullMQ delayed jobs with calculated millisecond offsets, completely eliminating brittle cron pollers.
- **Sliding-Window Rate Limiter**: Enforces strict per-sender hourly limits using Redis counters (`user:{id}:window:{timestamp}`) with automatic rescheduling when limits are exceeded.
- **Self-Healing Database & FK Guarantee**: Automatically resolves or provisions missing `User` and `Sender` records during schedule requests, preventing database constraint failures.
- **Live SMTP Simulation via Ethereal**: Uses Ethereal Nodemailer transport to simulate authentic SMTP delivery and logs inspectable email preview URLs for every dispatched message.
- **Bull-Board Queue Monitoring**: Built-in administrative dashboard at `/admin/queues` providing real-time visibility into active, delayed, and completed queues.
- **Full-Text Search with Fallback**: Elasticsearch queries with seamless database fallback filtering across recipient email, subject, and body with case-insensitive matching.
- **Slack OAuth & Webhook Broadcasting**: Floating action button that connects to Slack and dispatches notifications when sequences complete or rate-limit warnings occur.
- **Modern Frosted Glassmorphism UI**: Locked light-mode design with subtle pinkish watercolor canvas, drag-and-drop CSV parser, and dual-field compatibility.

---

## 🏗️ Architecture

```
reachinbox/
├── docker-compose.yml          # Redis, PostgreSQL, and Elasticsearch containers
├── package.json                # Root workspace configuration
├── .gitignore                  # Production-safe exclusions
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # User, Sender, EmailJob, SlackIntegration models
│   └── src/
│       ├── config.ts           # Env, Redis, Elasticsearch constants
│       ├── mailer.ts           # Ethereal Nodemailer transport helper
│       ├── queue.ts            # BullMQ Worker, 1-hour sliding rate limiter & queue
│       ├── search.ts           # Elasticsearch indexer & client with fallback
│       └── server.ts           # Express endpoints & Bull-Board adapter
└── frontend/
    ├── app/
    │   ├── globals.css         # Locked light mode & glassmorphism tokens
    │   ├── layout.tsx          # Root layout with suppressHydrationWarning
    │   └── page.tsx            # Main dashboard, metrics cards, debounced search
    ├── components/
    │   ├── ComposeModal.tsx    # Sequence composer, variable chips, CSV dropzone
    │   ├── EmailTable.tsx      # Scheduled / Sent states with row inspector
    │   ├── FileUpload.tsx      # Browser CSV/TXT email address extractor
    │   ├── LoginCard.tsx       # Google OAuth container & demo account trigger
    │   ├── Navbar.tsx          # Frosted header, mailbox branding, floating Slack
    │   └── StatusBadge.tsx     # Color-coded status pills
    ├── lib/
    │   └── api.ts              # Type-safe API client with localStorage cache fallback
    └── types/
        └── email.ts            # Shared TypeScript data contracts
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Redis** running locally on port `6379` (or via Docker)

### 2. Start Services via Docker (Optional)
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
The backend will run on **`http://localhost:5000`** with Bull-Board available at **`http://localhost:5000/admin/queues`**.

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/google` | Upserts Google account & provisions SMTP sender |
| `POST` | `/api/emails/schedule` | Self-healing batch scheduler (enqueues BullMQ delayed jobs) |
| `GET`  | `/api/emails/:tab` | Retrieves `scheduled` or `sent` jobs (Elasticsearch + DB search) |
| `GET`  | `/api/slack/status` | Checks Slack connection state for user |
| `GET`  | `/api/slack/oauth/callback` | OAuth redirect callback for Slack integration |
| `GET`  | `/health` | Health check probe |
| `USE`  | `/admin/queues` | Bull-Board UI for BullMQ monitoring |

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="file:./dev.db"
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_NODE=http://localhost:9200
WORKER_CONCURRENCY=5
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:5000/api/slack/oauth/callback
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id"
NEXT_PUBLIC_SLACK_CLIENT_ID="your_slack_client_id"
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

---


