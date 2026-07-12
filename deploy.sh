#!/usr/bin/env bash
# Stork Emotional — one-command deploy / redeploy on any server (no sudo needed).
# Requires: Docker (usable without sudo) + a ./.env file (see .env.example).
set -euo pipefail
cd "$(dirname "$0")"

# 0) .env ---------------------------------------------------------------------
if [ ! -f .env ]; then
  echo "!! .env missing. Create it first:"
  echo "     cp .env.example .env   &&   edit it"
  echo "   NGROK_AUTHTOKEN=<your token>   (required)"
  echo "   NGROK_DOMAIN=<your fixed domain>   (optional; empty = random quick-tunnel URL)"
  exit 1
fi
set -a; . ./.env; set +a
if [ -z "${NGROK_AUTHTOKEN:-}" ]; then echo "!! NGROK_AUTHTOKEN not set in .env"; exit 1; fi

# 1) docker compose v2 plugin (user-local, no sudo) ---------------------------
if ! docker compose version >/dev/null 2>&1; then
  echo ">> installing docker compose plugin to ~/.docker/cli-plugins ..."
  mkdir -p "$HOME/.docker/cli-plugins"
  ARCH="$(uname -m)"; case "$ARCH" in x86_64) ARCH=x86_64;; aarch64|arm64) ARCH=aarch64;; esac
  curl -fsSL "https://github.com/docker/compose/releases/download/v2.32.1/docker-compose-linux-${ARCH}" \
    -o "$HOME/.docker/cli-plugins/docker-compose"
  chmod +x "$HOME/.docker/cli-plugins/docker-compose"
fi

# 2) vendor frontend chart libs if missing (self-contained; no runtime CDN) ---
AS="frontend/assets"; mkdir -p "$AS" cache
fetch_asset() {  # url  filename
  if [ ! -s "$AS/$2" ]; then echo ">> fetching $2 ..."; curl -fsSL "$1" -o "$AS/$2"; fi
}
fetch_asset "https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js" "echarts.min.js"
fetch_asset "https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js" "echarts-gl.min.js"

# 3) build + (re)start --------------------------------------------------------
echo ">> building & starting stack ..."
docker compose up -d --build --remove-orphans

# 4) public URL ---------------------------------------------------------------
echo
echo "=================================================="
if [ -n "${NGROK_DOMAIN:-}" ]; then
  echo " Public URL : https://${NGROK_DOMAIN}"
  echo " Health     : https://${NGROK_DOMAIN}/api/health"
else
  echo " Public URL : (quick tunnel) finding it ..."
  URL=""
  for i in $(seq 1 20); do
    URL="$(docker compose logs ngrok 2>/dev/null | grep -oE 'https://[a-z0-9-]+\.ngrok[a-z0-9.-]*' | tail -1 || true)"
    [ -n "$URL" ] && break; sleep 2
  done
  echo " Public URL : ${URL:-"run: docker compose logs ngrok | grep -i url"}"
fi
echo "=================================================="
echo " Logs       : docker compose logs -f web ngrok"
echo " Stop       : docker compose down"
