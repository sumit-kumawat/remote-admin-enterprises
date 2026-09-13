#!/usr/bin/env bash
set -e

SERVICE_NAME="remote-admin-api.service"
WAS_ACTIVE=0

# Detect whether remote-admin-api.service is currently active using systemctl is-active
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active "$SERVICE_NAME" >/dev/null 2>&1; then
        echo "Stopping systemd service so dev server can bind :5000."
        systemctl stop "$SERVICE_NAME" 2>/dev/null || sudo -n systemctl stop "$SERVICE_NAME" 2>/dev/null || sudo systemctl stop "$SERVICE_NAME" 2>/dev/null || true
        WAS_ACTIVE=1
    fi
fi

cleanup() {
    local exit_code=$?
    trap - INT TERM EXIT
    if [ "$WAS_ACTIVE" -eq 1 ]; then
        echo ""
        if command -v systemctl >/dev/null 2>&1; then
            read -p "Do you want to restart the production systemd service ($SERVICE_NAME)? [y/N]: " choice
            case "$choice" in
                [Yy]* )
                    echo "Restarting $SERVICE_NAME..."
                    systemctl start "$SERVICE_NAME" 2>/dev/null || sudo -n systemctl start "$SERVICE_NAME" 2>/dev/null || sudo systemctl start "$SERVICE_NAME" 2>/dev/null || true
                    ;;
                * )
                    echo "Leaving $SERVICE_NAME stopped."
                    ;;
            esac
        fi
    fi
    exit "$exit_code"
}

trap cleanup INT TERM EXIT

set +e
ASPNETCORE_ENVIRONMENT=Development dotnet run --project src/RemoteAdmin.Api
EXIT_STATUS=$?
set -e

exit "$EXIT_STATUS"
