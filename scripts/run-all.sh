#!/usr/bin/env bash
set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo "=== 1. Pulling latest code ==="
git checkout -- frontend/package-lock.json package-lock.json 2>/dev/null || true
git reset --hard HEAD 2>/dev/null || true
git pull origin main

echo "=== 2. Opening firewall ports (5000 API, 3000 Frontend) if firewalld is active ==="
if command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --add-port=5000/tcp --permanent 2>/dev/null || true
    sudo firewall-cmd --add-port=3000/tcp --permanent 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
fi

echo "=== 3. Stopping background API and systemd services if running ==="
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop remote-admin-api.service 2>/dev/null || true
fi
pkill -f "RemoteAdmin.Api" 2>/dev/null || true

echo "=== 4. Ensuring PostgreSQL Container is Running ==="
docker compose up -d postgres
sleep 2

echo "=== 5. Rebuilding Backend API Binary ==="
PUBLISH_DIR="$REPO_DIR/publish"
dotnet build src/RemoteAdmin.Api/RemoteAdmin.Api.csproj -o "$PUBLISH_DIR" -m:1

echo "=== 6. Verifying Published Artifacts ==="
if [ ! -f "$PUBLISH_DIR/RemoteAdmin.Api.dll" ]; then
    echo "ERROR: Published binary RemoteAdmin.Api.dll not found in $PUBLISH_DIR"
    exit 1
fi

if [ ! -f "$PUBLISH_DIR/appsettings.json" ]; then
    echo "ERROR: Published appsettings.json not found in $PUBLISH_DIR"
    exit 1
fi

cleanup() {
    echo ""
    echo "Stopping API and Frontend child processes..."
    kill 0 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "=== 7. Launching Backend API from Published Content Root ==="
cd "$PUBLISH_DIR"
ASPNETCORE_ENVIRONMENT=Development dotnet RemoteAdmin.Api.dll &
API_PID=$!

echo "Waiting for Backend API to become healthy on http://127.0.0.1:5000/health (PID: $API_PID) ..."
API_READY=0
for i in {1..30}; do
    if ! kill -0 $API_PID 2>/dev/null; then
        echo "ERROR: Backend API process crashed on startup! (Process $API_PID exited)"
        exit 1
    fi
    if curl -fsS http://127.0.0.1:5000/health >/dev/null 2>&1; then
        echo "Backend API is healthy and listening on http://127.0.0.1:5000!"
        API_READY=1
        break
    fi
    sleep 1
done

if [ "$API_READY" -ne 1 ]; then
    echo "ERROR: Backend API failed to respond to health checks within 30 seconds."
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo "=== 8. Clearing Vite Cache & Launching Frontend Dev Server ==="
cd "$REPO_DIR/frontend"
rm -rf node_modules/.vite
echo "Ensuring frontend dependencies are up to date..."
npm install --prefer-offline --no-audit
npm run dev -- --force --host &

wait
