#!/usr/bin/env bash
# One-click deploy: build frontend, restart backend (kill process on PORT then start server)
# Requires Node.js >= 18
set -e
cd "$(dirname "$0")"
PORT="${PORT:-7010}"

NODE_VER=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ] 2>/dev/null; then
  echo "Error: Node.js >= 18 required, current: $(node -v 2>/dev/null || echo 'not found')"
  exit 1
fi

echo "Stopping process on port $PORT (if any)..."
if command -v lsof >/dev/null 2>&1; then
  (lsof -ti:"$PORT" | xargs kill -9) 2>/dev/null || true
else
  (fuser -k "$PORT/tcp") 2>/dev/null || true
fi
sleep 1

echo "Installing dependencies (clean install for correct native bindings)..."
rm -rf node_modules
npm install

echo "Building frontend..."
npm run build

echo "Starting backend on port $PORT..."
echo "Open: http://localhost:$PORT"
exec npm run server
