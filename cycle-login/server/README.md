# Cycle Login Server (cross-device accounts)

Run this server so accounts you create in the dev console work on **any device** (other computers, phones, etc.). Data is stored in `data/` as JSON files.

## Quick start

1. Install and run:
   ```bash
   cd cycle-login/server
   npm install
   npm start
   ```
   Server runs at **http://localhost:3847** by default.

2. In your frontend, set the API URL in **cycle-login/config.js**:
   ```js
   window.CYCLE_LOGIN_API_URL = 'http://localhost:3847';
   ```
   For other devices on your network, use your computer’s IP (e.g. `http://192.168.1.5:3847`). For the whole internet, deploy this server (see below) and set the public URL.

3. Create accounts in the dev console (PIN 9659829). Those accounts can then log in from any device that can reach this server.

## Environment variables

- **PORT** – Port (default: 3847)
- **CYCLE_LOGIN_DEV_PIN** – Dev PIN (default: 9659829)

## Data

- `data/users.json` – Accounts and cycle codes
- `data/visits.json` – Page visit log
- `data/state.json` – Visit count (cycle)

Back these up if you need to restore.

## Deploying (e.g. Railway, Render, Fly.io)

1. Deploy this folder (with `package.json` and `server.js`).
2. Set the public URL in **cycle-login/config.js** (e.g. `https://your-app.railway.app`).
3. Ensure the server is reachable over HTTPS for production.
