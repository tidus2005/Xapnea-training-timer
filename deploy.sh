#!/usr/bin/env bash
# Deploy: install deps and build frontend. Run this before restart.
# Frontend build output: dist/. Backend runs separately on 7010 via restart.sh.
set -e
cd "$(dirname "$0")"

NODE_VER=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ] 2>/dev/null; then
  echo "Error: Node.js >= 18 required, current: $(node -v 2>/dev/null || echo 'not found')"
  exit 1
fi

echo "Installing dependencies..."
rm -rf node_modules
npm install

echo "Building frontend (output: dist/)..."
npm run build

echo "Deploy done. Run 'sh restart.sh' to start backend on 7010. Frontend: serve dist/ on 3010 (e.g. npm run preview)."
