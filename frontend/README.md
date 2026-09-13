# Remote Admin Enterprises — Frontend Portal

Complete Windows Server Manager / SCCM-style endpoint management web portal built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, and Recharts.

---

## Requirements

* **Node.js**: v18+ or v20+
* **npm**: v9+ or v10+

---

## Environment Setup

Create a `.env` file or use `.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

---

## Installation

Run from `frontend/` directory:

```bash
npm install
```

---

## Development Server

Start dev server on `http://localhost:3000`:

```bash
npm run dev
```

---

## Production Build

Compile TypeScript and build optimized static assets:

```bash
npm run build
```

---

## Production Container (Docker & Nginx)

Build Docker container:

```bash
docker build -t remote-admin-frontend .
```

Run Docker container:

```bash
docker run -d -p 3000:80 remote-admin-frontend
```

---

## Features Implemented

* **Authentication & Role Guards**: JWT authentication stored via Zustand (`ra_token`), forced password change handler (`HTTP 428 Precondition Required`), `SuperAdmin` / `Admin` permission guard (`403 Forbidden`).
* **Operational Dashboard**: Live KPI tiles, Recharts status donut chart, 24h heartbeat trend, OS distribution, recent security activity.
* **Endpoint Management**: Dense SCCM-style inventory table, filtering by status and approval, search, Add Endpoint modal, detailed tabbed inspection (Hardware, Network, Installed Software, Storage Drives, Job execution history).
* **User Management**: Add user modal, role modification, custom confirmation deactivation, username-verification deletion guard.
* **Software Deployment Module**: Software package repository, 3-step deployment wizard (Package -> Endpoints -> Wave Schedule), job details matrix, retry failed targets.
* **Endpoint Discovery Module**: Subnet CIDR scan trigger, live scan status, discovered hosts list, import to managed inventory.
* **Audit Log Ledger**: Filterable audit log, right-side detail drawer with formatted JSON event payloads.
* **System Settings**: User profile, live backend server info (`GET /api/System/info`), agent telemetry parameters, notification rules, system info & about.
