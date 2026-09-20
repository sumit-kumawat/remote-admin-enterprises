# Architecture & Implementation Decisions

This document logs technical decisions made during the comprehensive audit and remediation of **Remote Admin Enterprises**.

---

## 1. Version Auto-Increment System
* **Decision**: Implemented `version.txt` at repo root with `x.y.z` standard semver formatting.
* **Implementation**: Node.js script (`scripts/bump-version.js`) automatically reads `version.txt`, bumps the patch version, updates `version.txt`, and generates `frontend/src/version.json` prior to any frontend build.
* **UI Integration**: `Sidebar.tsx` dynamically imports `version.json` to display the active version in the footer (`v1.0.5`).

## 2. Page Crash Prevention & Blank Screen Elimination
* **Decision**: Added a global React `ErrorBoundary` component to catch runtime crashes, rendering a clean dark-mode error screen with a full stack trace preview and "Reload Application" button.
* **API Alignment**: Fixed `/licensing/` API endpoint URLs in `licensingApi.ts` to include the mandatory `/api/licensing/` prefix. This resolved 404 errors causing white screen crashes on the KMS Management pages.
* **Drawer & Modal Overlay Guard**: Added `if (!isOpen) return null;` early return guard to `EndpointDetailDrawer.tsx` to prevent closed drawers from rendering an invisible full-screen fixed backdrop over the viewport.
* **Payload Unwrapping**: Updated `EndpointDetailDrawer.tsx` and `EndpointDetailPage.tsx` to handle both wrapped `{ data: EndpointDetailDto }` and direct `{ id: ... }` response structures safely.
* **Loading & Empty States**: Ensured loading skeletons and structured empty states render across Endpoint Detail and KMS Management tabs.

## 3. Total Removal of Live SignalR Event Console Stream
* **Decision**: Completely removed the real-time SignalR event stream as requested.
* **Backend Clean-up**: Deleted `DiscoveryHub.cs`, `DiscoveryHubNotifier.cs`, `IDiscoveryHubNotifier.cs`, `LicensingHub.cs`, and `LicensingHubNotifier.cs`. Removed `builder.Services.AddSignalR()` and `app.MapHub` endpoint mappings from `Program.cs`.
* **Frontend Clean-up**: Deleted `useDiscoveryHub.ts`. Removed SignalR connection status badges, hooks, and the "Live SignalR Event Console Stream" terminal component from `DiscoveryConsolePage.tsx` and related subnav pages.

## 4. Endpoint Bulk Deletion Feature
* **Decision**: Added a dedicated `Delete Selected` action button and dropdown item to the Endpoints list bulk toolbar.
* **Backend Support**: Implemented `[HttpDelete("{id}")]` and `[HttpPost("bulk-delete")]` endpoints in `EndpointsController.cs`.
* **User Experience**: Integrated a confirmation modal (`Modal`) displaying the count of endpoints to be removed, with explicit warning details and toast notifications upon completion.

## 5. Dashboard Toolbar Visual Alignment
* **Decision**: Unified the height of all header toolbar controls in `DashboardPage.tsx` using a consistent `h-9` height token (36px).
* **Styling Consistency**: Matched border tokens (`border-slate-300`), padding (`px-3`), font sizing (`text-xs font-semibold`), and flex alignment (`inline-flex items-center`).
* **Branding & Responsiveness**: Preserved primary color `#2F3EA0` for action buttons while ensuring control groups wrap cleanly on narrow viewports.

## 6. API & Swagger Verification
* **Decision**: Verified OpenAPI/Swagger generation across all 10 controllers.
* **Docs Route Mapping**: Added `/api/docs` redirect mapping in `Program.cs` pointing to `/swagger` UI.
