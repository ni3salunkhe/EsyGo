#!/usr/bin/env bash
# Verifies that the frozen design files are byte-identical to the delivered pack.
# After an APPROVED change request, regenerate the hashes in the same commit:
#   sha256sum docs/00-assignment-verbatim.md docs/01-final-design.md docs/02-api-contract.md docs/03-flows.md db/schema.sql db/audit/invariants.sql > docs/FROZEN.sha256
set -euo pipefail
cd "$(dirname "$0")/.."
sha256sum -c docs/FROZEN.sha256
