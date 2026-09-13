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

echo "=== 3. Stopping systemd service if running ==="
if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl stop remote-admin-api.service 2>/dev/null || true
fi

echo "=== 4. Ensuring PostgreSQL Container is Running ==="
rm -f .env
docker compose up -d
sleep 2

echo "=== 5. Fast Building Backend API ==="
dotnet build src/RemoteAdmin.Api/RemoteAdmin.Api.csproj -c Release

echo "=== 6. Preparing Frontend Dependencies ==="
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend packages..."
    npm install --prefer-offline --no-audit
fi

echo "=== 7. Launching Backend & Frontend ==="
cd "$REPO_DIR"

cleanup() {
    echo ""
    echo "Stopping API and Frontend..."
    kill 0 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Starting Backend API on http://0.0.0.0:5000 ..."
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/RemoteAdmin.Api/RemoteAdmin.Api.csproj -c Release --no-build &

echo "Waiting for Backend API to start listening on http://127.0.0.1:5000 ..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:5000/health >/dev/null 2>&1 || curl -s http://127.0.0.1:5000/api >/dev/null 2>&1; then
        echo "Backend API is ready and listening!"
        break
    fi
    sleep 1
done

echo "Starting Frontend Dev Server on http://0.0.0.0:3000 ..."
cd frontend
npm run dev -- --host &

wait
