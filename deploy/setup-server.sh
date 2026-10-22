#!/usr/bin/env bash
# One-time setup (safe to run again) for the parts of the site that need the
# Node server: blog, email sign-up, admin dashboard and paid designs.
# Runs ON THE VPS as root:
#
#   bash /root/livelifetricks/deploy/setup-server.sh
#
# It will:
#   1. create /root/livelifetricks-api.env if it doesn't exist (random admin password, printed once)
#   2. install and start the llt-api service
#   3. add the nginx line that sends /blog, /api and /admin to the service
#   4. check that everything answers
set -euo pipefail

REPO_DIR="${REPO_DIR:-/root/livelifetricks}"
ENV_FILE="${ENV_FILE:-/root/livelifetricks-api.env}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/livelifetricks.com.conf}"
INCLUDE_LINE="include $REPO_DIR/deploy/nginx-api.conf;"

say() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

[ "$(id -u)" = 0 ] || fail "Run this as root."
NODE_BIN="$(command -v node || true)"
[ -n "$NODE_BIN" ] || fail "Node.js is not installed. Install it first (see README, step 2.2)."
[ -f "$REPO_DIR/server/server.js" ] || fail "Can't find $REPO_DIR/server/server.js. Run deploy/update-from-github.sh first."
[ -f "$REPO_DIR/dist/_shell/blog.html" ] || { say "Building the site first"; (cd "$REPO_DIR" && "$NODE_BIN" build.js >/dev/null); }

# 1. Settings file
if [ ! -f "$ENV_FILE" ]; then
  say "Creating $ENV_FILE"
  ADMIN_PW="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)"
  sed -e "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$ADMIN_PW|" \
      -e "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 32)|" \
      "$REPO_DIR/deploy/api.env.example" > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  NEW_PASSWORD="$ADMIN_PW"
else
  say "Settings file already exists: $ENV_FILE (keeping it)"
  # Fill in anything an older settings file is missing
  if ! grep -q '^SESSION_SECRET=.\{20,\}' "$ENV_FILE"; then
    sed -i '/^SESSION_SECRET=/d' "$ENV_FILE"; echo "SESSION_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"; echo "    added SESSION_SECRET"
  fi
  grep -q '^INVITE_PRICE=' "$ENV_FILE" || { echo "INVITE_PRICE=29" >> "$ENV_FILE"; echo "    added INVITE_PRICE=29"; }
  grep -q '^SITE_URL=' "$ENV_FILE" || { echo "SITE_URL=https://livelifetricks.com" >> "$ENV_FILE"; echo "    added SITE_URL"; }
  grep -q '^ADMIN_PASSWORD=.\+' "$ENV_FILE" || fail "ADMIN_PASSWORD is empty in $ENV_FILE. Set one and run this again."
fi

# 2. Service (uses the full path to node, so nvm installs work too)
say "Installing the llt-api service"
sed "s|^ExecStart=.*|ExecStart=$NODE_BIN $REPO_DIR/server/server.js|" "$REPO_DIR/deploy/llt-api.service" > /etc/systemd/system/llt-api.service
systemctl daemon-reload
systemctl enable llt-api >/dev/null 2>&1
systemctl restart llt-api
sleep 2
systemctl is-active --quiet llt-api || { journalctl -u llt-api -n 20 --no-pager; fail "llt-api did not start (log above)."; }
PORT="$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2)"; PORT="${PORT:-3077}"
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null || fail "llt-api is running but not answering on port $PORT."
echo "    llt-api is running on port $PORT"

# 3. nginx
[ -f "$NGINX_CONF" ] || fail "Can't find $NGINX_CONF. Set NGINX_CONF=/path/to/your/site.conf and run again."
if grep -qF "$INCLUDE_LINE" "$NGINX_CONF"; then
  say "nginx already has the include line"
else
  grep -q 'listen[[:space:]]\+\(\[::\]:\)\?443' "$NGINX_CONF" || fail "No 'listen 443' block in $NGINX_CONF. Get HTTPS working first (certbot), then run again."
  say "Adding the include line to $NGINX_CONF (backup: $NGINX_CONF.bak)"
  cp "$NGINX_CONF" "$NGINX_CONF.bak"
  # Put it right after the first "listen ... 443 ...;" line, i.e. inside the HTTPS server block
  awk -v line="    $INCLUDE_LINE" '
    !done && /listen[[:space:]]+(\[::\]:)?443/ { print; print line; done = 1; next }
    { print }' "$NGINX_CONF.bak" > "$NGINX_CONF"
fi
if ! nginx -t 2>/tmp/llt-nginx-test.txt; then
  cat /tmp/llt-nginx-test.txt
  [ -f "$NGINX_CONF.bak" ] && cp "$NGINX_CONF.bak" "$NGINX_CONF" && echo "Restored the old nginx config."
  fail "nginx config test failed (details above)."
fi
systemctl reload nginx

# 4. Check through nginx
say "Checking"
check() { local code; code="$(curl -s -o /dev/null -w '%{http_code}' --resolve livelifetricks.com:443:127.0.0.1 "https://livelifetricks.com$1")"; printf '    %-22s %s\n' "$1" "$code"; [ "$code" = "$2" ]; }
ok=1
check /blog/ 200 || ok=0
check /blog/feed.xml 200 || ok=0
check /api/health 200 || ok=0
check /admin 200 || ok=0
[ "$ok" = 1 ] || fail "Some checks failed. Run: journalctl -u llt-api -n 50 --no-pager"

echo
echo "All done. Blog: https://livelifetricks.com/blog/   Admin: https://livelifetricks.com/admin"
if [ -n "${NEW_PASSWORD:-}" ]; then
  echo
  echo "Your admin password is:  $NEW_PASSWORD"
  echo "Save it now. To change it: edit ADMIN_PASSWORD in $ENV_FILE, then: systemctl restart llt-api"
fi
