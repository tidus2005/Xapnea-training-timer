<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/174b3b7b-8cd7-4c5c-b2c3-b4ee2fa0699d

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [.env.example](.env.example) to `.env` and set `PORT=7010`, `DATABASE_PATH=./data/apnea.db` (optional; these are the defaults).
3. Start **backend** (API + SQLite): `npm run server` — listens on **http://localhost:7010**
4. Start **frontend**: `npm run dev` — listens on **http://localhost:3010** and proxies `/api` to the backend.

Open http://localhost:3010 in the browser. Training sessions are stored in SQLite at `./data/apnea.db` (or `DATABASE_PATH`).

## One-Click Deploy (Restart)

Run `npm run restart` to: stop the process on port 7010 (if any), build the frontend, and start the backend. **After restart, open http://localhost:7010** (the same server serves both API and the built frontend; port 3010 is only used when running `npm run dev`). Script: [restart.sh](restart.sh) in project root. Uses `PORT` from env (default 7010). Requires `bash` and `lsof` (macOS/Linux).

## Production (e.g. Alibaba Cloud)

- Set `PORT=7010` and `DATABASE_PATH=/data/apnea.db` (or another persistent path).
- Run `npm run build`, then serve the `dist` folder (e.g. Nginx static or Express `express.static('dist')`), or use `npm run restart` to build and start the API.
- Point `/api` to the same machine on port 7010 (reverse proxy). Ensure the database directory exists and is writable.

## Features

- **Session history**: View past sessions and trends. Delete a session from the history screen via the trash icon on each session card.
