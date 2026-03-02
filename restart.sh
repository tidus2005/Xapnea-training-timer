#!/usr/bin/env bash
# Restart backend + frontend. Backend: 7010, Frontend: 3010. Run after deploy.
# Requires Node.js >= 18, dist/ from npm run deploy.
set -e
cd "$(dirname "$0")"
BACKEND_PORT="${PORT:-7010}"
FRONTEND_PORT="${FRONTEND_PORT:-3010}"

NODE_VER=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1)
if [ -z "$NODE_VER" ] || [ "$NODE_VER" -lt 18 ] 2>/dev/null; then
  echo "Error: Node.js >= 18 required, current: $(node -v 2>/dev/null || echo 'not found')"
  exit 1
fi

echo "Stopping backend (port $BACKEND_PORT) and frontend (port $FRONTEND_PORT)..."
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  if command -v lsof >/dev/null 2>&1; then
    (lsof -ti:"$port" | xargs kill -9) 2>/dev/null || true
  else
    (fuser -k "$port/tcp") 2>/dev/null || true
  fi
done
sleep 1

echo "Starting backend on port $BACKEND_PORT..."
export PORT=$BACKEND_PORT
npm run server &
BACKEND_PID=$!
sleep 1

if [ ! -d "dist" ]; then
  echo "Warning: dist/ not found. Run 'npm run deploy' first. Backend is running (PID $BACKEND_PID)."
  wait $BACKEND_PID
  exit 0
fi

echo "Starting frontend on port $FRONTEND_PORT (Open: http://localhost:$FRONTEND_PORT)"
exec npm run preview
