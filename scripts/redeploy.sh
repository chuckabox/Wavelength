#!/usr/bin/env bash
# Redeploy Wavelength on DigitalOcean App Platform from origin/main.
#
# Usage:
#   ./scripts/redeploy.sh              # point app at main + rebuild latest
#   ./scripts/redeploy.sh --no-wait    # kick off deploy, exit immediately
#   BRANCH=other ./scripts/redeploy.sh # override (default: main)
#
# Auth (first match wins):
#   DIGITALOCEAN_ACCESS_TOKEN / DO_API_TOKEN / DIGITALOCEAN_TOKEN
#   doctl auth token (if doctl is configured)
#   Bearer token from ~/.cursor/mcp.json (digitalocean-apps)

set -euo pipefail

APP_ID="${APP_ID:-808d3e13-9ca8-4fb3-baa4-1f526665a81e}"
APP_URL="${APP_URL:-https://wavelength-wxut4.ondigitalocean.app}"
BRANCH="${BRANCH:-main}"
API="https://api.digitalocean.com/v2"
WAIT=1
POLL_SECS="${POLL_SECS:-15}"
TIMEOUT_SECS="${TIMEOUT_SECS:-900}"

for arg in "$@"; do
  case "$arg" in
    --no-wait) WAIT=0 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 2
      ;;
  esac
done

resolve_token() {
  if [[ -n "${DIGITALOCEAN_ACCESS_TOKEN:-}" ]]; then
    printf '%s' "$DIGITALOCEAN_ACCESS_TOKEN"
    return
  fi
  if [[ -n "${DO_API_TOKEN:-}" ]]; then
    printf '%s' "$DO_API_TOKEN"
    return
  fi
  if [[ -n "${DIGITALOCEAN_TOKEN:-}" ]]; then
    printf '%s' "$DIGITALOCEAN_TOKEN"
    return
  fi
  if command -v doctl >/dev/null 2>&1; then
    local t
    t="$(doctl auth token 2>/dev/null || true)"
    if [[ -n "$t" ]]; then
      printf '%s' "$t"
      return
    fi
  fi
  local mcp="${HOME}/.cursor/mcp.json"
  if [[ -f "$mcp" ]]; then
    python3 - "$mcp" <<'PY'
import json, sys
path = sys.argv[1]
data = json.load(open(path))
for name, cfg in (data.get("mcpServers") or {}).items():
    if "digitalocean-apps" not in name:
        continue
    auth = (cfg.get("headers") or {}).get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        print(auth.split(" ", 1)[1].strip())
        sys.exit(0)
print("", end="")
sys.exit(1)
PY
    return
  fi
  return 1
}

TOKEN="$(resolve_token || true)"
if [[ -z "${TOKEN}" ]]; then
  echo "No DigitalOcean API token found." >&2
  echo "Set DIGITALOCEAN_ACCESS_TOKEN, or configure doctl / Cursor DO MCP." >&2
  exit 1
fi

api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$body" \
      "${API}${path}"
  else
    curl -sS -X "$method" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      "${API}${path}"
  fi
}

json_field() {
  python3 -c 'import json,sys; d=json.load(sys.stdin)
keys=sys.argv[1].split(".")
cur=d
for k in keys:
  if isinstance(cur, list):
    cur=cur[int(k)]
  else:
    cur=cur[k]
print(cur if cur is not None else "")' "$1"
}

echo "==> App: ${APP_ID}"
echo "==> URL: ${APP_URL}"

CURRENT="$(api GET "/apps/${APP_ID}")"
CURRENT_BRANCH="$(printf '%s' "$CURRENT" | json_field 'app.spec.services.0.git.branch')"
CURRENT_COMMIT="$(printf '%s' "$CURRENT" | python3 -c '
import json,sys
app=json.load(sys.stdin).get("app",{})
dep=app.get("active_deployment") or {}
svcs=dep.get("services") or []
print(svcs[0].get("source_commit_hash","") if svcs else "")
')"
echo "==> Current branch: ${CURRENT_BRANCH:-unknown}"
echo "==> Current commit: ${CURRENT_COMMIT:-unknown}"
echo "==> Target branch:  ${BRANCH}"

# Always pin the app to $BRANCH (default main) and pull the latest commit.
echo "==> Updating app spec → git branch ${BRANCH} (update_all_source_versions)"
UPDATED_SPEC="$(
  printf '%s' "$CURRENT" | BRANCH="$BRANCH" python3 -c '
import json, os, sys
app = json.load(sys.stdin)["app"]
spec = app["spec"]
branch = os.environ["BRANCH"]
for svc in spec.get("services") or []:
    if "git" in svc:
        svc["git"]["branch"] = branch
print(json.dumps({"spec": spec, "update_all_source_versions": True}))
'
)"
UPDATE_RESP="$(api PUT "/apps/${APP_ID}" "$UPDATED_SPEC")"
DEPLOY_ID="$(printf '%s' "$UPDATE_RESP" | json_field 'deployment.id' 2>/dev/null || true)"
if [[ -z "${DEPLOY_ID}" ]]; then
  # Some API responses nest the new deployment under the app object.
  DEPLOY_ID="$(printf '%s' "$UPDATE_RESP" | python3 -c '
import json,sys
d=json.load(sys.stdin)
print((d.get("deployment") or {}).get("id") or (d.get("app") or {}).get("in_progress_deployment",{}).get("id") or "")
' 2>/dev/null || true)"
fi
if [[ -z "${DEPLOY_ID}" ]]; then
  echo "Spec update did not return a deployment id; forcing a new deployment…"
  CREATE_RESP="$(api POST "/apps/${APP_ID}/deployments" '{"force_build":true}')"
  DEPLOY_ID="$(printf '%s' "$CREATE_RESP" | json_field 'deployment.id')"
fi
if [[ -z "${DEPLOY_ID}" ]]; then
  echo "Failed to start deployment:" >&2
  printf '%s\n' "${UPDATE_RESP:-$CREATE_RESP}" >&2
  exit 1
fi
echo "==> Deployment started: ${DEPLOY_ID}"

if [[ "$WAIT" -eq 0 ]]; then
  echo "Not waiting (--no-wait). Track in the DO console or re-run without --no-wait."
  exit 0
fi

echo "==> Waiting for deployment (timeout ${TIMEOUT_SECS}s)…"
START="$(date +%s)"
PHASE=""
while true; do
  NOW="$(date +%s)"
  ELAPSED=$((NOW - START))
  if [[ "$ELAPSED" -ge "$TIMEOUT_SECS" ]]; then
    echo "Timed out after ${TIMEOUT_SECS}s (last phase: ${PHASE:-unknown})" >&2
    exit 1
  fi

  DEPLOY="$(api GET "/apps/${APP_ID}/deployments/${DEPLOY_ID}")"
  PHASE="$(printf '%s' "$DEPLOY" | json_field 'deployment.phase')"
  PROGRESS="$(printf '%s' "$DEPLOY" | python3 -c '
import json,sys
d=json.load(sys.stdin)["deployment"]
p=d.get("progress") or {}
print("%s/%s" % (p.get("success_steps", 0), p.get("total_steps", 0)))
' 2>/dev/null || echo "?/?")"
  printf '    [%3ss] phase=%s progress=%s\n' "$ELAPSED" "$PHASE" "$PROGRESS"

  case "$PHASE" in
    ACTIVE)
      break
      ;;
    ERROR|CANCELED|SUPERSEDED)
      echo "Deployment ended in phase: ${PHASE}" >&2
      printf '%s\n' "$DEPLOY" | python3 -c '
import json,sys
d=json.load(sys.stdin)["deployment"]
print("cause:", d.get("cause"))
for step in ((d.get("progress") or {}).get("steps") or []):
    print(step.get("name"), step.get("status"), step.get("reason_human") or step.get("message") or "")
' >&2
      exit 1
      ;;
  esac
  sleep "$POLL_SECS"
done

NEW_COMMIT="$(api GET "/apps/${APP_ID}" | python3 -c '
import json,sys
app=json.load(sys.stdin).get("app",{})
dep=app.get("active_deployment") or {}
svcs=dep.get("services") or []
print(svcs[0].get("source_commit_hash","") if svcs else "")
')"
echo "==> Active commit: ${NEW_COMMIT:-unknown}"

echo "==> Smoke checks"
for path in /health /ready /; do
  CODE="$(curl -sS -o /tmp/wavelength-smoke.body -w '%{http_code}' "${APP_URL}${path}")"
  BODY="$(head -c 120 /tmp/wavelength-smoke.body | tr '\n' ' ')"
  echo "    ${path} → ${CODE} ${BODY}"
  if [[ "$CODE" != "200" ]]; then
    echo "Smoke failed on ${path}" >&2
    exit 1
  fi
done

echo "==> Redeploy OK → ${APP_URL}"
