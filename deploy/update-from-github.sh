#!/usr/bin/env bash
# Runs ON THE VPS. Pulls the latest code from GitHub, tests it, builds it
# and copies the finished site into the web folder.
#
#   bash /root/livelifetricks/deploy/update-from-github.sh
#
# Optional settings:
#   REPO_DIR  where the repo is cloned   (default /root/livelifetricks)
#   SITE_DIR  the folder nginx serves    (default /var/www/livelifetricks.com)
#   BRANCH    branch to deploy           (default main)
set -euo pipefail

# Everything is inside main() so bash reads the whole script before git
# updates this file.
main() {
  local repo_dir="${REPO_DIR:-/root/livelifetricks}"
  local site_dir="${SITE_DIR:-/var/www/livelifetricks.com}"
  local branch="${BRANCH:-main}"

  echo "==> Getting latest code from GitHub ($branch)"
  cd "$repo_dir"
  git fetch --depth 1 origin "$branch"
  # The server copy is never edited by hand, so match GitHub exactly.
  git reset --hard "origin/$branch"

  echo "==> Testing"
  node --test tests/*.test.js
  echo "==> Building"
  node build.js

  echo "==> Publishing to $site_dir"
  mkdir -p "$site_dir"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete dist/ "$site_dir/"
  else
    find "$site_dir" -mindepth 1 -delete
    cp -a dist/. "$site_dir/"
  fi
  if id www-data >/dev/null 2>&1 && [ "$(id -u)" = 0 ]; then
    chown -R www-data:www-data "$site_dir"
  fi
  # Restart the API server (biodata payments) if it's installed
  if systemctl list-unit-files llt-api.service >/dev/null 2>&1 && systemctl is-enabled llt-api >/dev/null 2>&1; then
    echo "==> Restarting API server"
    systemctl restart llt-api
  fi
  echo "==> Done: $(git log -1 --format='%h %s')"
}

main "$@"
