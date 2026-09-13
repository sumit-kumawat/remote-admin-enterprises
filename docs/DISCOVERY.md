# Remote Admin Enterprises — Enterprise Network & Endpoint Discovery Engine

This document provides technical documentation for the real-time subnet discovery engine, layered probe strategy, SignalR live telemetry streaming, single-subnet safety guardrails, and host promotion flow.

---

## 1. Architecture Overview

The Discovery subsystem discovers unmanaged devices across air-gapped subnet ranges in real-time, enriches live hosts with MAC vendor details, OS heuristics, and open port banners, and streams live telemetry to the operator interface via SignalR.

```
┌──────────────────────────────┐        SignalR Hub        ┌──────────────────────────────┐
│  React Frontend Console      │ ◄─────────────────────────┤  DiscoveryHub (/hubs/discovery)
│  (TanStack Query + Virtual)  │                           └──────────────▲───────────────┘
└──────────────┬───────────────┘                                          │ Live Events
               │ REST API                                                 │
┌──────────────▼───────────────┐        Background Engine  ┌──────────────┴───────────────┐
│  DiscoveryController         │ ─────────────────────────►│  DiscoveryScanEngine         │
│  (/api/Discovery/*)          │                           │  (SemaphoreSlim + PPS Cap)   │
└──────────────────────────────┘                           └──────────────┬───────────────┘
                                                                          │ EF Core Upsert
                                                               ┌──────────▼───────────────┐
                                                               │ PostgreSQL Database      │
                                                               └──────────────────────────┘
```

---

## 2. Probe Strategy & Layered Execution

The engine utilizes a 4-tier layered probe pipeline to maximize accuracy while minimizing network footprint:

1. **Layer 2 ARP Sweep**:
   - Executes ARP probes for hosts on directly connected local network interfaces.
   - Captures hardware MAC address instantly.
2. **Layer 3 ICMP Echo**:
   - Executes ICMP Echo (ping) for addresses missed by ARP.
   - Retries failed probes once with longer timeout before classification.
3. **Layer 4 TCP Connect Sweep**:
   - Scans target port sets (`22, 80, 135, 139, 443, 445, 3389, 5985, 5986`).
   - Distinguishes RST (Port Closed -> Host Up) vs. Connection Drop/Timeout (Filtered).
   - Banner Grab: Retrieves first 512 bytes on open TCP ports (1000ms hard timeout).
4. **Layer 4 UDP Probes**:
   - Optional probes on ports `53 (DNS)`, `161 (SNMP)`, `5353 (mDNS)`.

### Classification Logic
- **`Up`**: Responded to ARP, ICMP, or TCP (including TCP RST).
- **`Filtered`**: Connection timed out without response.
- **`Down`**: Confirmed inactive host.
- **`Unknown`**: Unreachable host state.

---

## 3. Host Enrichment Engine

Every detected live host is enriched synchronously prior to UI emission:

- **Reverse DNS**: Executed via `Dns.GetHostEntryAsync` with a strict **1000ms timeout**.
- **IEEE MAC OUI Resolution**: Uses bundled IEEE OUI vendor table (`OuiVendorLookupService`) to map MAC prefix (e.g. `00:15:5D` → `Microsoft`).
- **TTL → OS Heuristic**:
  - `TTL ≤ 64`: Linux / Unix family.
  - `64 < TTL ≤ 128`: Windows Server / Workstation family.
  - `TTL > 128`: Network Gear (Cisco, Juniper, Switches).
- **TCP Banner Grab**: Captures service banner signatures on open ports for OS and version identification.

---

## 4. Safety Guardrails & Single Subnet Enforcement

1. **Single Subnet Enforcement**:
   - Rejects multi-subnet CIDR blocks and multiple ranges. Scans must target a single contiguous subnet block.
2. **Prefix Length Hard Cap**:
   - Configured via `DiscoveryOptions:MaxPrefixLength` (Default: `/22` = 1022 maximum hosts per scan).
   - Protects corporate networks from accidental domain-wide scanning.
3. **Ownership Acknowledgment**:
   - Requests are strictly rejected unless `ConfirmedOwnership: true` is included in the POST request.
4. **Rate Limiting & Concurrency**:
   - Bounded parallelism via `SemaphoreSlim(500)` for TCP connect probes and `SemaphoreSlim(2000)` for ARP probes.
   - Global Token Bucket Rate Limiter (Default: `5000 pps` max packet rate).
5. **Audit Logging**:
   - Every scan launch, pause, resume, cancel, and endpoint promotion event is recorded in the system audit log.

---

## 5. Rescan & Host Deduplication

- Rescanning a subnet updates host records in-place by matching `(ScanId, IpAddress)` or IP/MAC combinations.
- Duplicate `DiscoveryHost` records are never created.
- `FirstSeenAt` is preserved while `LastSeenAt` and host metadata are updated live.

---

## 6. One-Click Host Promotion Flow

When an operator clicks **Promote**:
1. Host metadata (`Hostname`, `IpAddress`, `MacAddress`, `OsGuess`) is transferred into a new managed `Endpoint` entity.
2. `DiscoveryHost.IsPromoted` is set to `true` and linked via `PromotedEndpointId`.
3. An audit log entry is written.
4. The frontend UI reflects the promoted state instantly across SignalR and TanStack Query caches.
