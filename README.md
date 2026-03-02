<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/174b3b7b-8cd7-4c5c-b2c3-b4ee2fa0699d

## Run Locally

**Prerequisites:** Node.js **>= 18**

1. Install dependencies: `npm install`
2. Copy [.env.example](.env.example) to `.env` and set `PORT=7010`, `DATABASE_PATH=./data/apnea.db` (optional; these are the defaults).
3. Start **backend** (API): `npm run server` — **http://localhost:7010**
4. Start **frontend**: `npm run dev` — **http://localhost:3010** (proxies `/api` to 7010)

Ports: **frontend 3010**, **backend 7010**. Open http://localhost:3010. Data: SQLite at `./data/apnea.db` (or `DATABASE_PATH`).

## Deploy and Restart (production)

- **Deploy** (install deps + build frontend): `npm run deploy` or `sh deploy.sh` → produces `dist/`.
- **Restart** (backend + frontend, run after deploy): `npm run restart` or `sh restart.sh` → kills 7010 and 3010, starts backend (7010) then frontend (3010, serves `dist/`). Open http://localhost:3010

## Production (e.g. Alibaba Cloud)

- Set `PORT=7010`, `DATABASE_PATH=/data/apnea.db`. Run `sh deploy.sh` once, then `sh restart.sh` to start/restart the API.
- Serve frontend: Nginx on 3010 for `dist/`, proxy `/api` to 7010; or run `npm run preview` (port 3010, proxies /api to 7010).

## Features

- **Session history**: View past sessions and trends. Delete a session from the history screen via the trash icon on each session card.
