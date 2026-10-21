#!/usr/bin/env bash
# Build the site and upload it to the VPS.
#
# Usage (from the repo folder, on your own computer):
#   VPS_HOST=123.45.67.89 ./deploy/deploy.sh
#
# Optional: VPS_USER (default root), VPS_PORT (default 22),
#           REMOTE_DIR (default /var/www/livelifetricks.com)
set -euo pipefail

cd "$(dirname "$0")/.."

: "${VPS_HOST:?Set VPS_HOST to your Hostinger VPS IP address}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/livelifetricks.com}"

echo "Running tests..."
node --test tests/*.test.js

echo "Building..."
node build.js

echo "Uploading to $VPS_USER@$VPS_HOST:$REMOTE_DIR ..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete-after -e "ssh -p $VPS_PORT" dist/ "$VPS_USER@$VPS_HOST:$REMOTE_DIR/"

echo "Done. Visit https://livelifetricks.com"
