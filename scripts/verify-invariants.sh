#!/usr/bin/env bash
# Runs db/audit/invariants.sql against the configured database and fails if any
# invariant has violations. Credentials come from the environment only:
#   DB_HOST (default 127.0.0.1)  DB_PORT (default 3306)  DB_NAME  DB_USER (or DB_USERNAME)  DB_PASSWORD
# NOTE: an empty database passes every invariant. Check that data exists before trusting a PASS.
set -euo pipefail
DB_USER="${DB_USER:-${DB_USERNAME:-}}"
: "${DB_NAME:?set DB_NAME}"; : "${DB_USER:?set DB_USER or DB_USERNAME}"; : "${DB_PASSWORD:?set DB_PASSWORD}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(MYSQL_PWD="$DB_PASSWORD" mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USER" "$DB_NAME" -B -N < "$HERE/db/audit/invariants.sql")"
ROWS="$(MYSQL_PWD="$DB_PASSWORD" mysql -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "$DB_USER" "$DB_NAME" -B -N -e "SELECT (SELECT COUNT(*) FROM hotel), (SELECT COUNT(*) FROM room), (SELECT COUNT(*) FROM room_night), (SELECT COUNT(*) FROM booking)")"
echo "row counts (hotel, room, room_night, booking): $ROWS"
echo "$OUT" | awk -F'\t' '{printf "%-6s violations=%s  %s\n", substr($1,1,6), $2, $1}'
if echo "$OUT" | awk -F'\t' '$2 > 0 {bad=1} END {exit !bad}'; then
  echo "RESULT: FAIL - invariant violations found"; exit 1
fi
echo "RESULT: PASS - all invariants hold"
