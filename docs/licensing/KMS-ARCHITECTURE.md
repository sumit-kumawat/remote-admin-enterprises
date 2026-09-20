# Enterprise Microsoft KMS & Volume Activation Architecture

## System Role & Overview

`RemoteAdmin Enterprises` serves as the centralized management, auditing, and orchestration platform for Microsoft Volume Activation in enterprise environments.

### Core Architecture Principle

The application server (running ASP.NET Core / React / Docker) is **strictly** the orchestration, monitoring, and administrative layer. It does **NOT** run KMS emulator services or directly act as a Microsoft KMS host.

The actual Volume Activation authority remains on official **Windows Server KMS Hosts** (Windows Server 2022 / 2025) listening on **TCP 1688**.

```
                 REMOTE ADMIN ENTERPRISES
              ┌───────────────────────────┐
              │ React + API + PostgreSQL  │
              │ Jobs + SignalR + Audit    │
              └─────────────┬─────────────┘
                            │ HTTPS
              ┌─────────────▼─────────────┐
              │ Windows Endpoint Agent    │
              │ .NET 10 Windows Service   │
              └─────────────┬─────────────┘
                            │
                 Supported Windows
                 licensing operations
                            │
              ┌─────────────▼─────────────┐
              │ Windows KMS Infrastructure│
              │ Server 2022 / 2025        │
              │ TCP 1688                  │
              └───────────────────────────┘
```

## Key Architectural Components

1. **KmsHost Domain Entity & Health Service (`KmsHealthService`)**:
   - Performs TCP 1688 socket reachability tests, latency measurement, and DNS resolution checks for registered KMS servers.
2. **Endpoint Licensing Agents & Parsers (`WindowsActivationService` & `OfficeActivationService`)**:
   - Executes authorized administrative scripts (`slmgr.vbs` for Windows 10/11 & Server 2022/2025; `ospp.vbs` for Office LTSC 2024 / 2016-2021).
   - Dynamic 32-bit / 64-bit Office path discovery and regex-based output parsing.
3. **Activation Wave Engine (`ActivationWaveService`)**:
   - Rate-limited rollout engine for 500+ endpoints with controlled concurrency (`MaxConcurrentActivationJobs = 10`) and pause/resume/cancel controls.
4. **Air-Gapped Cryptographic Transfer Package Engine (`OfflinePackageService`)**:
   - Generates and imports HMAC-SHA256 signed JSON configuration packages for seamless migration between Staging and isolated Air-Gapped production environments.
