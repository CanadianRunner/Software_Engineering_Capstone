#!/usr/bin/env bash
# Smoke test: the API answers and returns certifications, and the frontend serves a page.
#
#   scripts/smoke.sh                       # local stack
#   scripts/smoke.sh https://sean-keane.com https://sean-keane.com   # production
#
# Arguments: API base URL, frontend base URL. Defaults target the local stack.
# Exit code is non-zero on the first failure.
set -u

api="${1:-https://localhost:5001}"
web="${2:-http://localhost:3000}"
fail=0

check() {
  local label="$1" ok="$2" detail="$3"
  if [ "$ok" = "1" ]; then
    printf 'ok    %s (%s)\n' "$label" "$detail"
  else
    printf 'FAIL  %s (%s)\n' "$label" "$detail"
    fail=1
  fi
}

# -k allows the local self-signed development certificate.
api_body="$(curl -ks --max-time 15 -w '\n%{http_code}' "$api/api/Certifications")"
api_status="${api_body##*$'\n'}"
api_json="${api_body%$'\n'*}"
check "API status is 200" "$([ "$api_status" = "200" ] && echo 1 || echo 0)" "$api/api/Certifications -> $api_status"

count="$(printf '%s' "$api_json" | grep -o '"id"' | wc -l | tr -d ' ')"
check "API returns certifications" "$([ "${count:-0}" -gt 0 ] && echo 1 || echo 0)" "count=$count"

web_status="$(curl -ks --max-time 15 -o /dev/null -w '%{http_code}' "$web/")"
check "Frontend status is 200" "$([ "$web_status" = "200" ] && echo 1 || echo 0)" "$web/ -> $web_status"

web_html="$(curl -ks --max-time 15 "$web/")"
check "Frontend serves the app shell" "$(printf '%s' "$web_html" | grep -qi '<div id="root"' && echo 1 || echo 0)" 'looks for <div id="root">'

exit "$fail"
