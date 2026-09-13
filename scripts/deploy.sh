#!/usr/bin/env bash
set -e

PUBLISH_DIR="/opt/remote-admin/api"
SERVICE_NAME="remote-admin-api"

echo "========================================="
echo " Starting Production Deployment Workflow"
echo "========================================="

echo "[1/4] Publishing application in Release configuration..."
dotnet publish src/RemoteAdmin.Api/RemoteAdmin.Api.csproj -c Release -o "$PUBLISH_DIR"

echo "[2/4] Deploy published output to $PUBLISH_DIR completed."

echo "[3/4] Reloading systemd daemon..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl daemon-reload 2>/dev/null || sudo -n systemctl daemon-reload 2>/dev/null || sudo systemctl daemon-reload 2>/dev/null || true
fi

echo "[4/4] Restarting systemd service $SERVICE_NAME..."
if command -v systemctl >/dev/null 2>&1; then
    systemctl restart "$SERVICE_NAME" 2>/dev/null || sudo -n systemctl restart "$SERVICE_NAME" 2>/dev/null || sudo systemctl restart "$SERVICE_NAME" 2>/dev/null || true
fi

echo "========================================="
echo " Deployment completed successfully!"
echo "========================================="
