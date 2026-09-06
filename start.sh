#!/usr/bin/env bash
set -euo pipefail
# Runtime governance modes: check|migrate|start. Prisma schema changes remain explicit.
# Local demo credential bridge (Codex managed)
demo_credentials_project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if [ -f "$demo_credentials_project_dir/.env" ]; then
  while IFS= read -r demo_credentials_line || [ -n "$demo_credentials_line" ]; do
    case "$demo_credentials_line" in ''|'#'*) continue ;; esac
    demo_credentials_line="${demo_credentials_line#export }"
    demo_credentials_key="${demo_credentials_line%%=*}"
    demo_credentials_value="${demo_credentials_line#*=}"
    case "$demo_credentials_key" in
      NODE_ENV|ENABLE_DEMO_CREDENTIAL_AUTOFILL|DEMO_EMAIL|DEMO_PASSWORD|SEED_ADMIN_EMAIL|SEED_ADMIN_PASSWORD|SEED_USER_EMAIL|SEED_USER_PASSWORD|PROVISION_ADMIN_EMAIL|PROVISION_ADMIN_PASSWORD|BOOTSTRAP_ADMIN_EMAIL|BOOTSTRAP_ADMIN_PASSWORD|ADMIN_EMAIL|ADMIN_PASSWORD|DEFAULT_EMAIL|DEFAULT_PASSWORD|DEMO_TENANT|BOOTSTRAP_TENANT_SLUG|GOVERNANCE_TENANT_ID|TENANT_ID) ;;
      *) continue ;;
    esac
    [ -n "${!demo_credentials_key+x}" ] && continue
    demo_credentials_first="${demo_credentials_value:0:1}"
    demo_credentials_last="${demo_credentials_value: -1}"
    if { [ "$demo_credentials_first" = '"' ] && [ "$demo_credentials_last" = '"' ]; } || { [ "$demo_credentials_first" = "'" ] && [ "$demo_credentials_last" = "'" ]; }; then
      demo_credentials_value="${demo_credentials_value:1:${#demo_credentials_value}-2}"
    fi
    export "$demo_credentials_key=$demo_credentials_value"
  done < "$demo_credentials_project_dir/.env"
fi
demo_credentials_email=""
demo_credentials_password=""
demo_credentials_tenant="${DEMO_TENANT:-${BOOTSTRAP_TENANT_SLUG:-${GOVERNANCE_TENANT_ID:-${TENANT_ID:-}}}}"
demo_credentials_tenant="${DEMO_TENANT:-${BOOTSTRAP_TENANT_SLUG:-${GOVERNANCE_TENANT_ID:-${TENANT_ID:-}}}}"
demo_credentials_tenant="${DEMO_TENANT:-${BOOTSTRAP_TENANT_SLUG:-${GOVERNANCE_TENANT_ID:-${TENANT_ID:-}}}}"
demo_credentials_tenant="${DEMO_TENANT:-${BOOTSTRAP_TENANT_SLUG:-${GOVERNANCE_TENANT_ID:-${TENANT_ID:-}}}}"
demo_credentials_tenant="${DEMO_TENANT:-${BOOTSTRAP_TENANT_SLUG:-${GOVERNANCE_TENANT_ID:-${TENANT_ID:-}}}}"
if [ -n "${PROVISION_ADMIN_EMAIL:-}" ] && [ -n "${PROVISION_ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$PROVISION_ADMIN_EMAIL"
  demo_credentials_password="$PROVISION_ADMIN_PASSWORD"
elif [ -n "${BOOTSTRAP_ADMIN_EMAIL:-}" ] && [ -n "${BOOTSTRAP_ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$BOOTSTRAP_ADMIN_EMAIL"
  demo_credentials_password="$BOOTSTRAP_ADMIN_PASSWORD"
elif [ -n "${SEED_ADMIN_EMAIL:-}" ] && [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$SEED_ADMIN_EMAIL"
  demo_credentials_password="$SEED_ADMIN_PASSWORD"
elif [ -n "${SEED_USER_EMAIL:-}" ] && [ -n "${SEED_USER_PASSWORD:-}" ]; then
  demo_credentials_email="$SEED_USER_EMAIL"
  demo_credentials_password="$SEED_USER_PASSWORD"
elif [ -n "${DEMO_EMAIL:-}" ] && [ -n "${DEMO_PASSWORD:-}" ]; then
  demo_credentials_email="$DEMO_EMAIL"
  demo_credentials_password="$DEMO_PASSWORD"
elif [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  demo_credentials_email="$ADMIN_EMAIL"
  demo_credentials_password="$ADMIN_PASSWORD"
elif [ -n "${DEFAULT_EMAIL:-}" ] && [ -n "${DEFAULT_PASSWORD:-}" ]; then
  demo_credentials_email="$DEFAULT_EMAIL"
  demo_credentials_password="$DEFAULT_PASSWORD"
fi
if [ "${NODE_ENV:-development}" != production ] && [ "${ENABLE_DEMO_CREDENTIAL_AUTOFILL:-false}" = true ] && [ -n "$demo_credentials_email" ] && [ -n "$demo_credentials_password" ]; then
  export NEXT_PUBLIC_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export NEXT_PUBLIC_DEMO_EMAIL="$demo_credentials_email"
  export NEXT_PUBLIC_DEMO_PASSWORD="$demo_credentials_password"
  export VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export VITE_DEMO_EMAIL="$demo_credentials_email"
  export VITE_DEMO_PASSWORD="$demo_credentials_password"
  export REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL=true
  export REACT_APP_DEMO_EMAIL="$demo_credentials_email"
  export REACT_APP_DEMO_PASSWORD="$demo_credentials_password"
  if [ -n "$demo_credentials_tenant" ]; then
    export NEXT_PUBLIC_DEMO_TENANT="$demo_credentials_tenant"
    export VITE_DEMO_TENANT="$demo_credentials_tenant"
    export REACT_APP_DEMO_TENANT="$demo_credentials_tenant"
  else
    unset NEXT_PUBLIC_DEMO_TENANT VITE_DEMO_TENANT REACT_APP_DEMO_TENANT
  fi
else
  export NEXT_PUBLIC_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  export VITE_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  export REACT_APP_ENABLE_DEMO_CREDENTIAL_AUTOFILL=false
  unset NEXT_PUBLIC_DEMO_EMAIL NEXT_PUBLIC_DEMO_PASSWORD NEXT_PUBLIC_DEMO_TENANT
  unset VITE_DEMO_EMAIL VITE_DEMO_PASSWORD VITE_DEMO_TENANT
  unset REACT_APP_DEMO_EMAIL REACT_APP_DEMO_PASSWORD REACT_APP_DEMO_TENANT
fi
unset demo_credentials_email demo_credentials_password demo_credentials_tenant demo_credentials_project_dir demo_credentials_line demo_credentials_key demo_credentials_value demo_credentials_first demo_credentials_last

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$PROJECT_DIR/.env"
load_env_file(){ local line key value;while IFS= read -r line||[ -n "$line" ];do [[ "$line" =~ ^[[:space:]]*# || "$line" =~ ^[[:space:]]*$ ]]&&continue;line="${line#export }";key="${line%%=*}";value="${line#*=}";key="${key//[[:space:]]/}";[[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]||continue;[ -n "${!key+x}" ]&&continue;if [[ "$value" == \"*\" && "$value" == *\" ]];then value="${value:1:${#value}-2}";elif [[ "$value" == \'*\' && "$value" == *\' ]];then value="${value:1:${#value}-2}";fi;export "$key=$value";done < "$ENV_FILE"; }
[ -f "$ENV_FILE" ]||{ echo "Missing required file: $ENV_FILE" >&2;exit 1; };load_env_file
export PATH="/opt/homebrew/bin:$PATH"
case "${1:-start}" in
  check) cd "$PROJECT_DIR";exec npm run typecheck ;;
  migrate) [[ "${ALLOW_SCHEMA_MIGRATION:-}" =~ ^(1|true)$ ]]||{ echo "Set ALLOW_SCHEMA_MIGRATION=1 for explicit migration" >&2;exit 1; };cd "$PROJECT_DIR";exec node runtime/migrate.mjs ;;
  start) ;;
  *) echo "Usage: $0 [start|check|migrate]" >&2;exit 64 ;;
esac
: "${BACKEND_PORT:?BACKEND_PORT is required}";: "${FRONTEND_PORT:?FRONTEND_PORT is required}";: "${DATABASE_URL:?DATABASE_URL is required}"
# AI is optional; non-AI workflows can start without provider credentials.
[ -z "${OPENROUTER_BASE_URL:-}" ] || [ "${OPENROUTER_BASE_URL:-}" = "https://openrouter.ai/api/v1" ]||{ echo "Exact OPENROUTER_BASE_URL is required" >&2;exit 1; }
[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]||{ echo "Assigned ports must differ" >&2;exit 1; }
node "$PROJECT_DIR/scripts/clear-project-ports.cjs" "$BACKEND_PORT" "$FRONTEND_PORT"
[ -d "$PROJECT_DIR/node_modules" ]&&[ -d "$PROJECT_DIR/runtime" ]||{ echo "Runtime dependencies are missing" >&2;exit 1; }
export RUNTIME_PROJECT_NAME=homeservices RUNTIME_AI_ENDPOINT=/api/ai/home-service-operations-review RUNTIME_AI_FEATURE=home-service-operations-review
export RUNTIME_AI_SYSTEM_PROMPT='You are a home-services operations assistant. Review scheduling, dispatch, technician, customer, estimate, invoice, inventory, safety, and approval evidence with explicit human decision gates.'
node "$PROJECT_DIR/runtime/setup.mjs"
runtime_psql(){ node "$PROJECT_DIR/runtime/psql.mjs" "$@"; }
if [[ "${ALLOW_SCHEMA_MIGRATION:-}" =~ ^(1|true)$ ]]; then
  app_schema_exists="$(runtime_psql -Atqc "SELECT to_regclass('public.\"Company\"') IS NOT NULL")"
  if [ "$app_schema_exists" != t ]; then
    runtime_psql -v ON_ERROR_STOP=1 -f "$PROJECT_DIR/prisma/migrations/20251203123121_init/migration.sql"
    runtime_psql -v ON_ERROR_STOP=1 -f "$PROJECT_DIR/prisma/migrations/20260720000000_governed_estimates/migration.sql"
  fi
  follow_up_schema_exists="$(runtime_psql -Atqc "SELECT to_regclass('public.\"FollowUpTask\"') IS NOT NULL")"
  if [ "$follow_up_schema_exists" != t ]; then
    runtime_psql -v ON_ERROR_STOP=1 -1 -f "$PROJECT_DIR/prisma/migrations/20260905000000_follow_up_tasks/migration.sql"
  fi
fi
operations_schema_exists="$(runtime_psql -Atqc "SELECT to_regclass('public.\"WorkflowMutation\"') IS NOT NULL")"
if [ "$operations_schema_exists" != t ]; then
  if [[ "${ALLOW_SCHEMA_MIGRATION:-}" =~ ^(1|true)$ ]]; then
    runtime_psql -v ON_ERROR_STOP=1 -1 -f "$PROJECT_DIR/prisma/migrations/20260906000000_operations_expansion/migration.sql"
  else
    echo "Operations migration is required. Back up the database, then start with ALLOW_SCHEMA_MIGRATION=1." >&2
    exit 1
  fi
fi
assistant_schema_exists="$(runtime_psql -Atqc "SELECT to_regclass('public.\"AssistantRequest\"') IS NOT NULL")"
if [ "$assistant_schema_exists" != t ]; then
  if [[ "${ALLOW_SCHEMA_MIGRATION:-}" =~ ^(1|true)$ ]]; then
    runtime_psql -v ON_ERROR_STOP=1 -1 -f "$PROJECT_DIR/prisma/migrations/20260906010000_assistant_delivery/migration.sql"
  else
    echo "AI workspace migration is required. Back up the database, then start with ALLOW_SCHEMA_MIGRATION=1." >&2
    exit 1
  fi
fi
if [[ "${ALLOW_SCHEMA_MIGRATION:-}" =~ ^(1|true)$ ]]; then
  (cd "$PROJECT_DIR" && node runtime/migrate.mjs)
fi
finance_schema_exists="$(runtime_psql -Atqc "SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='PaymentRefund' AND column_name='settledAt') AND EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='Payment_verified_stripe_receipt')")"
if [ "$finance_schema_exists" != t ]; then
  echo "Finance migration is required. Back up the database, then start with ALLOW_SCHEMA_MIGRATION=1." >&2
  exit 1
fi
software_schema_exists="$(runtime_psql -Atqc "SELECT to_regclass('public.\"SoftwareSubscription\"') IS NOT NULL")"
if [ "$software_schema_exists" != t ]; then
  echo "Software billing migration is required. Back up the database, then run ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate." >&2
  exit 1
fi
(cd "$PROJECT_DIR" && npx prisma generate)
npm --prefix "$PROJECT_DIR" run create-admin
if [ "${LOAD_DEMO_DATA:-false}" = true ] && [ "${NODE_ENV:-development}" != production ]; then
  (cd "$PROJECT_DIR" && npm run demo-data:load)
fi
CHILD_PIDS=()
(cd "$PROJECT_DIR"&&exec node runtime/api.mjs)&CHILD_PIDS+=("$!")
(cd "$PROJECT_DIR"&&exec npm run dev -- -H 127.0.0.1 -p "$FRONTEND_PORT")&CHILD_PIDS+=("$!")
cleanup(){ trap - EXIT INT TERM;for pid in "${CHILD_PIDS[@]}";do kill "$pid" 2>/dev/null||true;done;for pid in "${CHILD_PIDS[@]}";do wait "$pid" 2>/dev/null||true;done; }
trap cleanup EXIT INT TERM
wait "${CHILD_PIDS[@]}"
