# Remote Admin Enterprises — System Architecture & Reference Documentation

**Remote Admin Enterprises** is an enterprise-grade platform engineered to manage Windows 10/11 endpoints and Windows Server infrastructure within air-gapped, high-security, and restricted network environments.

---

## 1. What the Portal Does

* **Endpoint Inventory & Control**: Real-time tracking of online/offline status, IP/MAC metadata, operating system editions, local account provisioning, and credential management.
* **Microsoft KMS Volume Activation**: Automated administration of legitimate Volume Licensing Key Management Services (KMS), activation status tracking (Windows & Office), activation waves, and offline package transfers for air-gapped networks.
* **Subnet Discovery**: Multi-protocol IP discovery (ARP, ICMP, TCP SYN/Connect) to discover unmanaged Windows devices and promote them into managed inventory.
* **Security & Auditability**: System-wide event audit logging, role-based authorization (SuperAdmin, Admin, Operator, Viewer), and mandatory credential security policies.

---

## 2. Frontend Architecture & Folder Structure

Built using **React (TypeScript)**, **Vite**, **TailwindCSS**, **React Router v6**, **React Query (TanStack Query)**, and **Lucide React**.

```
frontend/
├── src/
│   ├── api/             # Axios REST client modules (auth, endpoints, licensing, discovery, etc.)
│   ├── components/      # Common UI components (ErrorBoundary, Modals, Drawers, Badges, Skeletons)
│   ├── hooks/           # Custom React hooks & React Query wrappers
│   ├── pages/           # Page routes (Dashboard, Endpoints, KMS Management, Discovery, Audit, Settings)
│   ├── store/           # Global Zustand state stores (auth, toast)
│   ├── types/           # TypeScript interface definitions (API responses, DTOs, domain models)
│   ├── utils/           # Helper utilities (formatters, cron parsers, validators)
│   ├── App.tsx          # Root router & React Error Boundary integration
│   └── main.tsx         # Application entry point
├── package.json         # Build & automated version bump scripts
└── vite.config.ts       # Vite bundler configuration
```

---

## 3. Backend Architecture, Modules & Route Map

Built on **.NET 10 Web API**, adhering to Clean Architecture principles:

* `RemoteAdmin.Api`: Controllers, Middleware, Auth Policies, Swagger configuration.
* `RemoteAdmin.Application`: DTOs, Application Interfaces, KMS Services, Activation Logic.
* `RemoteAdmin.Infrastructure`: EF Core AppDbContext, Discovery Engine, Audit Service, Windows Management.
* `RemoteAdmin.Domain`: Entities, Value Objects, Enums.
* `RemoteAdmin.Contracts`: Shared API DTOs and Contracts.

### API Route Summary

| Controller | Route Prefix | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/Auth` | User authentication, token generation, password change |
| **Endpoints** | `/api/Endpoints` | Inventory CRUD, WMI connection checks, bulk actions, local accounts |
| **Licensing** | `/api/licensing` | KMS host configuration, Windows & Office activation, waves, offline packages |
| **Discovery** | `/api/Discovery` | Subnet discovery scan execution, scheduling, host promotion |
| **Audit** | `/api/Audit` | Centralized system audit event querying |
| **Credentials** | `/api/Credentials` | Management of domain & local admin credential profiles |
| **Dashboard** | `/api/Dashboard` | Real-time system metrics & endpoint status aggregations |

---

## 4. Database Models & Key Relationships

Managed using Entity Framework Core with SQLite (development/standalone) or PostgreSQL (production):

* **Endpoint**: Core entity representing managed target machine (`Id`, `Hostname`, `IpAddress`, `MacAddress`, `Status`, `ApprovalStatus`, `AuthStatus`).
* **CredentialProfile**: Encrypted credential profiles assigned to endpoints or inherited by default.
* **KmsHost**: Legitimate Microsoft KMS host server records (`HostName`, `IpAddress`, `Port`, `HostStatus`, `TotalActivationRequests`).
* **ActivationRecord**: Historical log of endpoint activation attempts (`EndpointId`, `ProductType`, `ActivationStatus`, `Method`).
* **ActivationWave**: Staged deployment waves for enterprise-wide batch activations.
* **DiscoveryScan** & **DiscoveryHost**: Subnet discovery execution runs and unmanaged target host probe results.
* **AuditEvent**: Immutable audit trail for security operations (`Actor`, `Action`, `Target`, `Result`, `DetailsJson`).

---

## 5. Authentication & Authorization Flow

1. **JWT Authentication**: Clients log in via `/api/Auth/login` and receive a JWT Bearer token stored securely in client state.
2. **Role-Based Access Control (RBAC)**:
   * **SuperAdmin**: Full system management, user administration.
   * **Admin**: Endpoint registration, KMS host setup, bulk deletions, offline exports.
   * **Operator**: Connection checks, triggering activations, manual scan runs.
   * **Viewer**: Read-only access to dashboard and inventory metrics.
3. **Password Security Policy**: Mandatory initial password change enforced via `MustChangePasswordMiddleware`.

---

## 6. Endpoints & KMS Feature Operation

### KMS & Volume Activation Workflow
1. **KMS Host Setup**: Register legitimate internal KMS Host servers (`slmgr.vbs /ipk <GVLK>`).
2. **Endpoint Configuration**: Point endpoints to target KMS host via RPC/Port 1688 (`slmgr.vbs /skms <kms-host>:1688`).
3. **Activation Execution**: Issue legitimate volume activation (`slmgr.vbs /ato`).
4. **Offline Package Air-Gap Support**: Generate signed offline activation payload packages for isolated networks, transfer via physical media, and import on air-gapped target controllers.

---

## 7. How to Run Locally & In Production

### Prerequisites
* **.NET 10 SDK**
* **Node.js v20+** & **npm**

### Local Development Mode
```bash
# 1. Restore & Build Backend
dotnet build RemoteAdmin.slnx

# 2. Run Backend API (Swagger UI live at http://localhost:5000/swagger)
dotnet run --project src/RemoteAdmin.Api

# 3. Build & Run Frontend
cd frontend
npm install
npm run dev
```

### Production Build & Deployment
```bash
# Automated Build with Version Auto-Increment
npm --prefix frontend run build
dotnet publish src/RemoteAdmin.Api/RemoteAdmin.Api.csproj -c Release -o ./publish
```
