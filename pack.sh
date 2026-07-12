#!/usr/bin/env bash
# Package the project into a portable tarball (excludes secrets & cache).
set -euo pipefail
cd "$(dirname "$0")"
OUT="${1:-stork_emotional.tgz}"

tar czf "$OUT" \
  --exclude='.env' \
  --exclude='cache' \
  --exclude='*.tgz' \
  --exclude='__pycache__' \
  --exclude='.git' \
  -C .. stork_emotional

SIZE="$(du -h "$OUT" | cut -f1)"
echo "Packaged -> $OUT ($SIZE)"
echo
echo "Deploy on a new server:"
echo "  scp $OUT user@new-server:~/"
echo "  ssh user@new-server"
echo "  tar xzf $OUT && cd stork_emotional"
echo "  cp .env.example .env   # then put your NGROK_AUTHTOKEN in it"
echo "  ./deploy.sh"
