#!/usr/bin/env bash
set -euo pipefail
project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_dir="${RUNTIME_PROJECT_SOURCE:-$project_dir}"
runtime_port="${PORT:-${BACKEND_PORT:-}}"
[[ "$runtime_port" =~ ^[0-9]+$ ]] || { echo "PORT or BACKEND_PORT must be an assigned numeric port" >&2; exit 2; }
if lsof -tiTCP:"$runtime_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Assigned port $runtime_port is already in use; no process was stopped" >&2
  exit 1
fi
export PORT="$runtime_port"
if [[ "${NODE_ENV:-development}" != production ]]; then
  frontend_port="${FRONTEND_PORT:-${CLIENT_PORT:-}}"
  [[ "$frontend_port" =~ ^[0-9]+$ ]] || { echo "FRONTEND_PORT or CLIENT_PORT must be an assigned numeric port" >&2; exit 2; }
  export CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-http://127.0.0.1:$frontend_port}"
  export TEMPLATE_ALLOWED_HOSTS="${TEMPLATE_ALLOWED_HOSTS:-templates.example.test}"
  export EMAIL_DELIVERY_URL="${EMAIL_DELIVERY_URL:-https://email-provider.example.test/v1/send}"
  export EMAIL_DELIVERY_ALLOWED_HOSTS="${EMAIL_DELIVERY_ALLOWED_HOSTS:-email-provider.example.test}"
  export EMAIL_DELIVERY_TOKEN="${EMAIL_DELIVERY_TOKEN:-${SECRET_KEY:-}}"
fi
cd "$app_dir"
if [[ "${NODE_ENV:-development}" == production ]]; then
  exec npm start -- -H 127.0.0.1 -p "$runtime_port"
fi
exec npm run dev -- -H 127.0.0.1 -p "$runtime_port"
