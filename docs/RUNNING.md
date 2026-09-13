# Running & Deployment Workflows

This document describes the standard development and production deployment workflows for **Remote Admin Enterprises**.

---

## Local Development Workflow

When developing locally, **do not** directly run `dotnet run` if the production systemd service (`remote-admin-api.service`) is already running, as both will attempt to bind to port `5000` and result in an `address already in use` error.

### Safe Development Command

Use the developer workflow script from the repository root:

```bash
./scripts/dev.sh
```

### What `./scripts/dev.sh` Does:

1. **Service Detection**: Checks whether `remote-admin-api.service` is active using `systemctl is-active remote-admin-api.service`.
2. **Graceful Shutdown**: If active, warns the developer with:
   `Stopping systemd service so dev server can bind :5000.`
   and stops the systemd service before starting the development server.
3. **Starts Dev Server**: Runs `ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/RemoteAdmin.Api`.
4. **Clean Exit Handling**: Traps `Ctrl+C` and normal process exits cleanly.
5. **Restart Prompt**: Upon dev server exit, asks whether to restart the production `remote-admin-api.service`.

---

## Production Deployment Workflow

Production instances of the Remote Admin Enterprises API are managed by systemd under `remote-admin-api.service`. Do not start production manually using `dotnet run`.

### Deployment Command

To publish and deploy a new build to production, run:

```bash
./scripts/deploy.sh
```

### What `./scripts/deploy.sh` Does:

1. **Publish**: Publishes the .NET application in `Release` configuration to `/opt/remote-admin/api`.
2. **Daemon Reload**: Triggers `systemctl daemon-reload`.
3. **Service Restart**: Restarts `remote-admin-api.service`.
4. **Error Handling**: Fails immediately if any deployment step encounters an error.

---

## Systemd Service Management

To manually inspect or manage the production service:

```bash
# Check service status
systemctl status remote-admin-api

# Start service
systemctl start remote-admin-api

# Stop service
systemctl stop remote-admin-api

# View API logs
journalctl -u remote-admin-api -f
```
