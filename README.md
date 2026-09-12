# Remote Admin Enterprises

**Enterprise Windows Endpoint Management Platform**

Centrally manage 500+ Windows 10/11 computers from a single console — inventory, software deployment, local account management, endpoint discovery, and complete audit logging — all operating fully offline in an air-gapped network.

| | |
|---|---|
| **Version** | v1.0 |
| **Author** | Sumit Kumawat |
| **Website** | [www.sumitkumawat.com](https://www.sumitkumawat.com) |
| **Support** | [hello@sumitkumawat.com](mailto:hello@sumitkumawat.com) |

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
  - [Windows](#windows-prerequisites)
  - [Linux (Ubuntu/Debian)](#linux-ubuntudebian-prerequisites)
  - [Linux (RHEL/CentOS/Fedora)](#linux-rhelcentosfedora-prerequisites)
  - [macOS](#macos-prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Installation — Development Environment](#installation--development-environment)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Set Up PostgreSQL](#2-set-up-postgresql)
  - [3. Configure the Backend](#3-configure-the-backend)
  - [4. Run Database Migrations](#4-run-database-migrations)
  - [5. Start the Backend API](#5-start-the-backend-api)
  - [6. Start the Frontend](#6-start-the-frontend)
- [Installation — Production Deployment](#installation--production-deployment)
  - [Option A: Docker Compose (Recommended)](#option-a-docker-compose-recommended)
  - [Option B: Windows Server (Native)](#option-b-windows-server-native)
  - [Option C: Linux Server (Native)](#option-c-linux-server-native)
- [Windows Agent Installation](#windows-agent-installation)
- [First-Time Setup](#first-time-setup)
- [Configuration Reference](#configuration-reference)
- [Database Backup & Restore](#database-backup--restore)
- [Project Structure](#project-structure)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [License](#license)

---

## Overview

Remote Admin Enterprises is a centralized, secure, air-gapped Windows endpoint management platform built with:

- **Backend:** C# / .NET 10 / ASP.NET Core Web API
- **Frontend:** React / TypeScript / Vite / Tailwind CSS
- **Database:** PostgreSQL 16+
- **Agent:** C# / .NET Windows Worker Service
- **Real-time:** SignalR (WebSocket)

It uses a **Central Server + Windows Agent** architecture — the lightweight agent runs as a Windows Service on each managed endpoint, communicates securely with the management server, and executes approved operations locally.

---

## Architecture

```
                     ADMINISTRATOR
                          │
                     HTTPS / LAN
                          │
                ┌─────────▼─────────┐
                │  React/TypeScript  │
                │   Frontend SPA     │
                └─────────┬─────────┘
                          │
                     REST + SignalR
                          │
                ┌─────────▼─────────┐
                │  ASP.NET Core      │
                │   Web API          │
                └─────────┬─────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
       PostgreSQL    Background      Package
                      Workers        Storage
                          │
                     Local LAN
                          │
      ┌───────────────────┼───────────────────┐
      │                   │                   │
      ▼                   ▼                   ▼
  Windows Agent      Windows Agent      Windows Agent
   (PC-001)           (PC-002)           (PC-003)
```

---

## Features

- ✅ Centralized endpoint inventory (hardware, OS, network, software)
- ✅ Software deployment with wave-based rollout
- ✅ Local account management (create, enable, disable, reset, group membership)
- ✅ LAN discovery (CIDR scanning)
- ✅ Agent-based architecture with heartbeat monitoring
- ✅ Certificate-based agent identity
- ✅ Package repository with SHA-256 integrity verification
- ✅ Job engine with retry, wave control, and approval workflow
- ✅ Role-based access control (SuperAdmin, Admin, Operator, Auditor, Viewer)
- ✅ Complete audit logging
- ✅ Real-time dashboard with SignalR
- ✅ CSV/XLSX/PDF report export
- ✅ Fully offline / air-gapped operation
- ✅ No cloud dependencies

---

## Prerequisites

### Windows Prerequisites

1. **Install .NET 10 SDK**

   Download from: https://dotnet.microsoft.com/download/dotnet/10.0

   Or install via `winget`:
   ```powershell
   winget install Microsoft.DotNet.SDK.10
   ```

   Verify:
   ```powershell
   dotnet --version
   ```

2. **Install Node.js 20+ (LTS)**

   Download from: https://nodejs.org/

   Or install via `winget`:
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

   Verify:
   ```powershell
   node --version
   npm --version
   ```

3. **Install PostgreSQL 16+**

   Download from: https://www.postgresql.org/download/windows/

   Or install via `winget`:
   ```powershell
   winget install PostgreSQL.PostgreSQL.16
   ```

   During installation:
   - Set a password for the `postgres` superuser
   - Keep the default port `5432`
   - Start the service automatically

4. **Install Git**

   ```powershell
   winget install Git.Git
   ```

5. **(Optional) Install Docker Desktop** — for containerized deployment

   ```powershell
   winget install Docker.DockerDesktop
   ```

---

### Linux (Ubuntu/Debian) Prerequisites

1. **Install .NET 10 SDK**

   ```bash
   # Add Microsoft package repository
   wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   rm packages-microsoft-prod.deb

   # Install .NET SDK
   sudo apt-get update
   sudo apt-get install -y dotnet-sdk-10.0

   # Verify
   dotnet --version
   ```

2. **Install Node.js 20+ (LTS)**

   ```bash
   # Using NodeSource
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Verify
   node --version
   npm --version
   ```

3. **Install PostgreSQL 16+**

   ```bash
   # Add PostgreSQL repository
   sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
   wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
   sudo apt-get update

   # Install
   sudo apt-get install -y postgresql-16

   # Start and enable
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # Verify
   psql --version
   ```

4. **Install Git**

   ```bash
   sudo apt-get install -y git
   ```

5. **(Optional) Install Docker**

   ```bash
   sudo apt-get install -y docker.io docker-compose-plugin
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   # Log out and back in for group change to take effect
   ```

---

### Linux (RHEL/CentOS/Fedora) Prerequisites

1. **Install .NET 10 SDK**

   ```bash
   # Fedora
   sudo dnf install -y dotnet-sdk-10.0

   # RHEL/CentOS (add Microsoft repo first)
   sudo rpm -Uvh https://packages.microsoft.com/config/rhel/$(rpm -E %rhel)/packages-microsoft-prod.rpm
   sudo dnf install -y dotnet-sdk-10.0

   # Verify
   dotnet --version
   ```

2. **Install Node.js 20+ (LTS)**

   ```bash
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo dnf install -y nodejs

   # Verify
   node --version
   npm --version
   ```

3. **Install PostgreSQL 16+**

   ```bash
   # Install PostgreSQL repository
   sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-$(rpm -E %rhel)-x86_64/pgdg-redhat-repo-latest.noarch.rpm

   # Install
   sudo dnf install -y postgresql16-server postgresql16

   # Initialize and start
   sudo /usr/pgsql-16/bin/postgresql-16-setup initdb
   sudo systemctl start postgresql-16
   sudo systemctl enable postgresql-16

   # Verify
   /usr/pgsql-16/bin/psql --version
   ```

4. **Install Git**

   ```bash
   sudo dnf install -y git
   ```

5. **(Optional) Install Docker**

   ```bash
   sudo dnf install -y docker docker-compose-plugin
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

---

### macOS Prerequisites

1. **Install Homebrew** (if not already installed)

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install .NET 10 SDK**

   ```bash
   brew install dotnet

   # Verify
   dotnet --version
   ```

3. **Install Node.js 20+ (LTS)**

   ```bash
   brew install node@20

   # Verify
   node --version
   npm --version
   ```

4. **Install PostgreSQL 16+**

   ```bash
   brew install postgresql@16
   brew services start postgresql@16

   # Verify
   psql --version
   ```

5. **Install Git**

   ```bash
   brew install git
   ```

6. **(Optional) Install Docker Desktop**

   ```bash
   brew install --cask docker
   ```

---

## Quick Start (Development)

The fastest way to get the project running locally:

```bash
# 1. Clone
git clone https://github.com/sumit-kumawat/remote-admin-enterprises.git
cd remote-admin-enterprises

# 2. Start PostgreSQL with Docker
docker compose up -d

# 3. Run the backend
cd src/RemoteAdmin.Api
dotnet run

# 4. In a new terminal — run the frontend
cd frontend
npm install
npm run dev

# 5. Open http://localhost:3000 in your browser
```

---

## Installation — Development Environment

### 1. Clone the Repository

```bash
git clone https://github.com/sumit-kumawat/remote-admin-enterprises.git
cd remote-admin-enterprises
```

### 2. Set Up PostgreSQL

**Option A: Docker (simplest)**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5432` with:
- Database: `remote_admin`
- Username: `remote_admin`
- Password: `dev_password_change_me`

**Option B: Local PostgreSQL installation**

Connect to PostgreSQL as the superuser and run:

```sql
-- Linux/macOS
sudo -u postgres psql

-- Windows (use pgAdmin or psql from Start Menu)
psql -U postgres
```

Then create the database and user:

```sql
CREATE USER remote_admin WITH PASSWORD 'dev_password_change_me';
CREATE DATABASE remote_admin OWNER remote_admin;
GRANT ALL PRIVILEGES ON DATABASE remote_admin TO remote_admin;
\q
```

### 3. Configure the Backend

The development configuration is pre-set in `src/RemoteAdmin.Api/appsettings.Development.json`. If you used a different database password, update the `ConnectionStrings:DefaultConnection` value:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=remote_admin;Username=remote_admin;Password=YOUR_PASSWORD_HERE"
  }
}
```

> ⚠️ **Never commit real passwords.** The development config uses a placeholder password. For production, use environment variables or a separate untracked config file.

### 4. Run Database Migrations

```bash
cd src/RemoteAdmin.Api

# Install EF Core tools (first time only)
dotnet tool install --global dotnet-ef

# Run migrations (auto-runs in Development mode, but you can run manually)
dotnet ef database update
```

### 5. Start the Backend API

```bash
cd src/RemoteAdmin.Api
dotnet run
```

The API starts on:
- **HTTP:** http://localhost:5000
- **Swagger UI:** http://localhost:5000/swagger (development only)
- **Health check:** http://localhost:5000/health

### 6. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install    # first time only
npm run dev
```

The frontend starts on http://localhost:3000 and proxies API requests to the backend.

---

## Installation — Production Deployment

### Option A: Docker Compose (Recommended)

Best for: Linux servers, quick deployment, isolated environments.

**1. Prepare the server**

```bash
# Install Docker and Docker Compose
# (see Prerequisites section for your OS)

# Clone the repository
git clone https://github.com/sumit-kumawat/remote-admin-enterprises.git
cd remote-admin-enterprises
```

**2. Create the production environment file**

```bash
cp .env.example .env
```

Edit `.env` with strong production values:

```bash
# REQUIRED — change all of these
POSTGRES_PASSWORD=your_very_strong_database_password_here
JWT_KEY=generate-a-random-64-character-string-use-openssl-rand-base64-48
CONNECTION_STRING=Host=postgres;Port=5432;Database=remote_admin;Username=remote_admin;Password=your_very_strong_database_password_here

# Generate a random JWT key:
# openssl rand -base64 48
```

**3. Build and start**

```bash
# Build the frontend
cd frontend && npm ci && npm run build && cd ..

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker compose ps
docker compose logs -f
```

**4. Configure HTTPS (recommended)**

Place your TLS certificate and key, then configure a reverse proxy (nginx/Caddy) in front of the API. Example with Caddy:

```
remote-admin.local {
    reverse_proxy localhost:5000
    tls /path/to/cert.pem /path/to/key.pem
}
```

---

### Option B: Windows Server (Native)

Best for: organizations that prefer Windows Server, no Docker required.

**1. Install prerequisites on the Windows Server**

```powershell
# Install .NET 10 Runtime (not SDK — runtime is sufficient for production)
winget install Microsoft.DotNet.Runtime.10

# Install ASP.NET Core Runtime
winget install Microsoft.DotNet.AspNetCore.10

# Install PostgreSQL 16
winget install PostgreSQL.PostgreSQL.16
```

**2. Create the database**

Open pgAdmin or run in PowerShell:

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE USER remote_admin WITH PASSWORD 'YourStrongPassword';"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE remote_admin OWNER remote_admin;"
```

**3. Build the application**

```powershell
# Clone the repo
git clone https://github.com/sumit-kumawat/remote-admin-enterprises.git
cd remote-admin-enterprises

# Build the backend
dotnet publish src/RemoteAdmin.Api -c Release -o C:\RemoteAdmin\Api

# Build the frontend
cd frontend
npm ci
npm run build
# Copy built frontend into the API's wwwroot
Copy-Item -Recurse dist\* C:\RemoteAdmin\Api\wwwroot\
cd ..
```

**4. Configure**

Create `C:\RemoteAdmin\Api\appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=remote_admin;Username=remote_admin;Password=YourStrongPassword"
  },
  "Jwt": {
    "Key": "your-64-character-random-secret-key-here",
    "Issuer": "RemoteAdminEnterprises",
    "Audience": "RemoteAdminEnterprises"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information"
    }
  }
}
```

**5. Install as a Windows Service**

```powershell
# Create the service
sc.exe create "RemoteAdminApi" binPath="C:\RemoteAdmin\Api\RemoteAdmin.Api.exe" start=auto DisplayName="Remote Admin Enterprises API"

# Configure recovery (restart on failure)
sc.exe failure "RemoteAdminApi" reset=86400 actions=restart/5000/restart/10000/restart/30000

# Start the service
sc.exe start "RemoteAdminApi"
```

**6. Configure Windows Firewall**

```powershell
New-NetFirewallRule -DisplayName "Remote Admin API" -Direction Inbound -Port 5000 -Protocol TCP -Action Allow
```

**7. (Recommended) Set up IIS as a reverse proxy**

Install the IIS URL Rewrite and Application Request Routing modules, then configure IIS to proxy requests to `http://localhost:5000` with HTTPS termination.

---

### Option C: Linux Server (Native)

Best for: Linux servers without Docker.

**1. Install prerequisites**

Follow the [Linux Prerequisites](#linux-ubuntudebian-prerequisites) section for your distribution.

**2. Create the database**

```bash
sudo -u postgres psql -c "CREATE USER remote_admin WITH PASSWORD 'YourStrongPassword';"
sudo -u postgres psql -c "CREATE DATABASE remote_admin OWNER remote_admin;"
```

**3. Build the application**

```bash
git clone https://github.com/sumit-kumawat/remote-admin-enterprises.git
cd remote-admin-enterprises

# Build backend
dotnet publish src/RemoteAdmin.Api -c Release -o /opt/remote-admin/api

# Build frontend
cd frontend
npm ci
npm run build
cp -r dist/* /opt/remote-admin/api/wwwroot/
cd ..
```

**4. Configure**

Create `/opt/remote-admin/api/appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=remote_admin;Username=remote_admin;Password=YourStrongPassword"
  },
  "Jwt": {
    "Key": "your-64-character-random-secret-key-here",
    "Issuer": "RemoteAdminEnterprises",
    "Audience": "RemoteAdminEnterprises"
  }
}
```

**5. Create a systemd service**

Create `/etc/systemd/system/remote-admin.service`:

```ini
[Unit]
Description=Remote Admin Enterprises API
After=network.target postgresql.service

[Service]
Type=notify
User=www-data
Group=www-data
WorkingDirectory=/opt/remote-admin/api
ExecStart=/usr/bin/dotnet /opt/remote-admin/api/RemoteAdmin.Api.dll
Restart=always
RestartSec=5
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://0.0.0.0:5000

[Install]
WantedBy=multi-user.target
```

```bash
# Set permissions
sudo chown -R www-data:www-data /opt/remote-admin

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable remote-admin
sudo systemctl start remote-admin

# Check status
sudo systemctl status remote-admin
sudo journalctl -u remote-admin -f
```

**6. Configure nginx as a reverse proxy**

Create `/etc/nginx/sites-available/remote-admin`:

```nginx
server {
    listen 443 ssl;
    server_name remote-admin.local;

    ssl_certificate     /etc/ssl/certs/remote-admin.crt;
    ssl_certificate_key /etc/ssl/private/remote-admin.key;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SignalR WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name remote-admin.local;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/remote-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Windows Agent Installation

The agent runs as a Windows Service on each managed endpoint.

### Build the Agent

```bash
# From the project root
dotnet publish src/RemoteAdmin.Agent -c Release -r win-x64 --self-contained -o ./publish/agent
```

This creates a self-contained executable that includes the .NET runtime — no need to install .NET on every endpoint.

### Install on a Windows Endpoint

1. **Copy** the `publish/agent` folder to the target machine, e.g., `C:\Program Files\RemoteAdmin\Agent\`

2. **Configure** — edit `appsettings.json`:

   ```json
   {
     "Agent": {
       "ServerUrl": "https://remote-admin.local",
       "HeartbeatIntervalSeconds": 60,
       "InventoryIntervalMinutes": 60
     }
   }
   ```

3. **Install as a Windows Service**:

   ```powershell
   # Run PowerShell as Administrator
   sc.exe create "RemoteAdminAgent" binPath="C:\Program Files\RemoteAdmin\Agent\RemoteAdmin.Agent.exe" start=auto DisplayName="Remote Admin Agent"

   # Configure automatic restart on failure
   sc.exe failure "RemoteAdminAgent" reset=86400 actions=restart/5000/restart/10000/restart/30000

   # Start the service
   sc.exe start "RemoteAdminAgent"

   # Verify
   sc.exe query "RemoteAdminAgent"
   ```

4. **Firewall** — the agent initiates outbound HTTPS connections only. No inbound firewall rules are needed.

### Uninstall the Agent

```powershell
sc.exe stop "RemoteAdminAgent"
sc.exe delete "RemoteAdminAgent"
Remove-Item "C:\Program Files\RemoteAdmin\Agent" -Recurse -Force
```

---

## First-Time Setup

When the server starts for the first time:

1. Open the web UI at `https://remote-admin.local` (or your configured address)
2. You will see the login page
3. Create the initial administrator account through the setup API:

   ```bash
   curl -X POST https://remote-admin.local/api/auth/setup \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "YourStrongAdminPassword!",
       "passwordConfirmation": "YourStrongAdminPassword!",
       "email": "admin@yourdomain.local"
     }'
   ```

4. Log in with the credentials you just created
5. Navigate to **Discovery** to scan your network or **Endpoints** to add computers manually

---

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` | `Development` or `Production` |
| `ASPNETCORE_URLS` | `http://+:5000` | Listening URLs |
| `POSTGRES_DB` | `remote_admin` | Database name |
| `POSTGRES_USER` | `remote_admin` | Database user |
| `POSTGRES_PASSWORD` | — | Database password (**required**) |
| `JWT_KEY` | — | JWT signing key, min 64 chars (**required**) |
| `JWT_ISSUER` | `RemoteAdminEnterprises` | JWT issuer |
| `JWT_AUDIENCE` | `RemoteAdminEnterprises` | JWT audience |
| `JWT_EXPIRY_MINUTES` | `480` | Token expiry (8 hours) |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | `Information` | Minimum log level |
| `PACKAGE_STORAGE_PATH` | `./packages` | Local package storage directory |

### Application Settings (appsettings.json)

```json
{
  "Agent": {
    "HeartbeatIntervalSeconds": 60,
    "HeartbeatTimeoutMultiplier": 3,
    "InventoryIntervalMinutes": 60,
    "EnrollmentTokenExpiry": "24:00:00"
  },
  "Deployment": {
    "DefaultWaveSize": 25,
    "MaxRetries": 3,
    "DefaultTimeoutSeconds": 3600,
    "OfflineWaitHours": 72
  }
}
```

---

## Database Backup & Restore

### Backup

```bash
# Using pg_dump
pg_dump -h localhost -U remote_admin -d remote_admin -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# Docker
docker compose exec postgres pg_dump -U remote_admin -d remote_admin -F c > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Restore

```bash
# Using pg_restore
pg_restore -h localhost -U remote_admin -d remote_admin --clean --if-exists backup_20260913_030000.dump

# Docker
docker compose exec -T postgres pg_restore -U remote_admin -d remote_admin --clean --if-exists < backup_20260913_030000.dump
```

### Automated Backup (Linux cron)

```bash
# Add to crontab: crontab -e
0 2 * * * pg_dump -h localhost -U remote_admin -d remote_admin -F c -f /backups/remote_admin_$(date +\%Y\%m\%d).dump && find /backups -name "*.dump" -mtime +30 -delete
```

### Automated Backup (Windows Task Scheduler)

Create a PowerShell script `C:\RemoteAdmin\backup.ps1`:

```powershell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\RemoteAdmin\Backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h localhost -U remote_admin -d remote_admin -F c -f "$backupDir\backup_$timestamp.dump"
Get-ChildItem $backupDir -Filter "*.dump" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

Schedule it via Task Scheduler to run daily.

---

## Project Structure

```
remote-admin-enterprises/
├── src/
│   ├── RemoteAdmin.Api/              # ASP.NET Core Web API
│   │   ├── Controllers/              # API controllers
│   │   ├── Middleware/                # Custom middleware
│   │   ├── Hubs/                     # SignalR hubs
│   │   └── Program.cs                # Application entry point
│   ├── RemoteAdmin.Application/      # Business logic & services
│   │   ├── Services/                 # Application services
│   │   ├── Interfaces/               # Service interfaces
│   │   ├── Dtos/                     # Data transfer objects
│   │   └── Validators/               # FluentValidation validators
│   ├── RemoteAdmin.Domain/           # Domain entities & enums
│   │   ├── Entities/                 # Entity classes
│   │   ├── Enums/                    # Enumerations
│   │   ├── Interfaces/               # Repository interfaces
│   │   └── Common/                   # Base classes
│   ├── RemoteAdmin.Infrastructure/   # Data access & external services
│   │   ├── Data/                     # DbContext & configurations
│   │   ├── Repositories/             # Repository implementations
│   │   └── Services/                 # Infrastructure services
│   ├── RemoteAdmin.Worker/           # Background job processing
│   ├── RemoteAdmin.Agent/            # Windows endpoint agent
│   └── RemoteAdmin.Contracts/        # Shared DTOs (API ↔ Agent)
│       ├── Agent/                    # Agent communication contracts
│       └── Dtos/                     # Shared data transfer objects
├── frontend/                         # React TypeScript SPA
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Page components
│   │   ├── contexts/                 # React contexts
│   │   └── lib/                      # API client, SignalR, utilities
│   └── vite.config.ts
├── tests/
│   ├── RemoteAdmin.UnitTests/
│   └── RemoteAdmin.IntegrationTests/
├── deployment/                       # Deployment configurations
├── docs/                             # Documentation
├── scripts/                          # Utility scripts
├── docker-compose.yml                # Development Docker Compose
├── .env.example                      # Environment template
└── RemoteAdmin.slnx                  # .NET solution file
```

---

## Development Guide

### Building the Entire Solution

```bash
dotnet build RemoteAdmin.slnx
```

### Running Tests

```bash
# All tests
dotnet test RemoteAdmin.slnx

# Unit tests only
dotnet test tests/RemoteAdmin.UnitTests

# With verbose output
dotnet test RemoteAdmin.slnx --verbosity normal
```

### Adding a Database Migration

```bash
cd src/RemoteAdmin.Api

# Create a new migration
dotnet ef migrations add YourMigrationName --project ../RemoteAdmin.Infrastructure

# Apply migrations
dotnet ef database update

# Rollback last migration
dotnet ef migrations remove
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Lint
npm run lint
```

### Generating a Secure JWT Key

```bash
# Linux/macOS
openssl rand -base64 48

# PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

---

## Troubleshooting

### Backend won't start

| Issue | Solution |
|---|---|
| `Jwt:Key is not configured` | Set `Jwt:Key` in `appsettings.Development.json` or environment |
| `Connection refused` on port 5432 | Ensure PostgreSQL is running: `docker compose up -d` or `systemctl start postgresql` |
| `password authentication failed` | Verify the database user and password match the connection string |
| `relation "..." does not exist` | Run migrations: `dotnet ef database update` |

### Frontend won't start

| Issue | Solution |
|---|---|
| `node_modules` missing | Run `npm install` in the `frontend/` directory |
| Proxy errors to `/api` | Ensure the backend is running on port 5000 |
| Build errors after pulling | Delete `node_modules` and `npm install` again |

### Agent won't connect

| Issue | Solution |
|---|---|
| Connection refused | Verify `ServerUrl` in agent config points to the correct server address |
| Certificate errors | Ensure the server's TLS certificate is trusted on the endpoint |
| Service won't start | Check Windows Event Viewer → Application log for errors |
| Firewall blocking | Agent only needs outbound HTTPS (port 443 or your configured port) |

### Docker issues

```bash
# View logs
docker compose logs -f

# Restart services
docker compose restart

# Full reset (destroys data!)
docker compose down -v
docker compose up -d
```

---

## Security

### Production Checklist

- [ ] Change all default passwords in `.env`
- [ ] Generate a strong random JWT key (minimum 64 characters)
- [ ] Enable HTTPS with a valid TLS certificate
- [ ] Restrict `CORS_ORIGINS` to your actual domain
- [ ] Set `ASPNETCORE_ENVIRONMENT=Production`
- [ ] Configure firewall rules (only expose port 443)
- [ ] Set up automated database backups
- [ ] Review and restrict PostgreSQL `pg_hba.conf`
- [ ] Never commit `.env` files or secrets to Git
- [ ] Rotate JWT keys and database passwords periodically
- [ ] Monitor audit logs for unauthorized access

### Security Architecture

- **Authentication:** JWT with HMAC-SHA256, automatic account lockout after 5 failed attempts
- **Authorization:** Role-based (SuperAdmin, Admin, Operator, Auditor, Viewer)
- **Password Storage:** HMAC-SHA512 with per-user random salt (never plaintext)
- **Agent Identity:** Certificate-based authentication, unique per endpoint
- **Package Integrity:** SHA-256 hash verification before installation
- **Audit Trail:** Every administrative action is logged with timestamp, user, target, and result
- **Headers:** X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, X-XSS-Protection

---

## License

**Remote Admin Enterprises** — Internal/Commercial use.

Copyright © Sumit Kumawat. All rights reserved.

Website: [www.sumitkumawat.com](https://www.sumitkumawat.com)
Support: [hello@sumitkumawat.com](mailto:hello@sumitkumawat.com)
