#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO "AuditEvent" (id, "companyId", action, "entityType", "entityId", payload, "eventHash", "createdAt")
SELECT 'ci-immutable-audit', id, 'VALIDATE', 'Migration', 'ci', '{}'::jsonb, 'ci-immutable-event-hash', CURRENT_TIMESTAMP
FROM "Company" LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO "EstimateVersion" (id, "estimateId", version, snapshot, provenance, "createdAt")
SELECT 'ci-immutable-version', id, 999999, '{}'::jsonb, '{}'::jsonb, CURRENT_TIMESTAMP
FROM "Estimate" LIMIT 1
ON CONFLICT (id) DO NOTHING;
SQL

if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "UPDATE \"AuditEvent\" SET action='TAMPERED' WHERE id='ci-immutable-audit'"; then
  echo 'AuditEvent mutation unexpectedly succeeded' >&2
  exit 1
fi
if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "DELETE FROM \"EstimateVersion\" WHERE id='ci-immutable-version'"; then
  echo 'EstimateVersion deletion unexpectedly succeeded' >&2
  exit 1
fi
if psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c "DELETE FROM \"Estimate\" WHERE id=(SELECT id FROM \"Estimate\" LIMIT 1)"; then
  echo 'Retained Estimate deletion unexpectedly succeeded' >&2
  exit 1
fi
