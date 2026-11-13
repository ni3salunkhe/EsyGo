#!/usr/bin/env bash
# Structural self-check of the handover pack (not of the application).
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0; bad() { echo "FAIL: $*"; fail=1; }
[ -f AGENTS.md ] || bad "AGENTS.md missing"
for f in .agents/rules/*.md .agents/workflows/*.md AGENTS.md; do
  n=$(wc -m < "$f"); [ "$n" -lt 12000 ] || bad "$f has $n chars (limit 12000)"; [ "$n" -lt 8000 ] || echo "WARN: $f is $n chars"
done
for d in .agents/skills/*/; do
  s="${d}SKILL.md"; [ -f "$s" ] || { bad "$d has no SKILL.md"; continue; }
  head -1 "$s" | grep -q '^---$' || bad "$s: no frontmatter"
  nm=$(sed -n 's/^name: *//p' "$s" | head -1 | tr -d '"'); [ "$nm" = "$(basename "$d")" ] || bad "$s: name '$nm' != folder"
  ds=$(sed -n 's/^description: *//p' "$s" | head -1); [ -n "$ds" ] || bad "$s: empty description"; [ ${#ds} -le 1024 ] || bad "$s: description > 1024 chars"
done
for w in .agents/workflows/*.md; do sed -n '2p' "$w" | grep -q '^description:' || bad "$w: missing description frontmatter"; done
# referenced paths exist
grep -rhoE '`(docs|db|scripts|audits|references)/[A-Za-z0-9_./*-]+`' AGENTS.md .agents docs START_HERE.md 2>/dev/null | tr -d '`' | sort -u | while read -r p; do
  # files the agent creates later (listed explicitly; every other reference must exist now)
  case "$p" in *'*'*|docs/change-requests*|audits/AUDIT-*|references/*|db/seed.sql) continue;; esac
  [ -e "$p" ] || echo "MISSING-REF: $p"
done | tee /tmp/missing_refs.txt | grep -q . && { cat /tmp/missing_refs.txt; fail=1; }
for sk in .agents/skills/*/; do grep -oE 'references/[A-Za-z0-9_.-]+' "${sk}SKILL.md" | sort -u | while read -r r; do [ -e "${sk}${r}" ] || echo "MISSING-SKILL-REF: ${sk}${r}"; done; done | tee /tmp/missing_sref.txt | grep -q . && { cat /tmp/missing_sref.txt; fail=1; }
for sh in scripts/*.sh; do bash -n "$sh" || bad "$sh syntax"; done
[ -f docs/FROZEN.sha256 ] && sha256sum -c --quiet docs/FROZEN.sha256 || bad "frozen hashes missing or changed"
git grep -nIE 'jdbc:mysql://[^ ]*:[^ @]*@' >/dev/null 2>&1 && bad "credential-like JDBC URL found" 
[ $fail -eq 0 ] && echo "PACK CHECK: PASS" || { echo "PACK CHECK: FAIL"; exit 1; }
