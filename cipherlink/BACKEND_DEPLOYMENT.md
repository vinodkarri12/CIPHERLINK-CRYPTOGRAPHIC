# CIPHERLINK – Python FastAPI Backend Deployment Guide

This guide explains how to deploy the CIPHERLINK Python FastAPI cryptographic backend to a production Python hosting service (Render, Railway, Fly.io, or AWS/DigitalOcean).

---

## Architecture Overview

- **Frontend (Static SPA):** Hosted on **GitHub Pages** at `https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/`.
- **Backend (Python FastAPI + Cryptography Engine):** Runs separately as a high-performance ASGI service handling:
  - NIST P-256 (SECP256R1) & Curve25519 ECC key generation.
  - ECDH point multiplication & HKDF-SHA256 key derivation.
  - Chunked AES-256-GCM authenticated encryption & decryption.
  - 4-Device mesh signaling & WebSocket transfer coordination.
  - SQLite telemetry logging & algorithmic benchmarks.

> **Note:** GitHub Pages exclusively serves static files (HTML, JS, CSS). It cannot execute Python binaries or ASGI servers. Therefore, the FastAPI backend must be hosted on a Python-compatible hosting platform.

---

## Option 1: Deploy on Render (Recommended, Free Tier Available)

1. Create a free account at [render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `vinodkarri12/CIPHERLINK-CRYPTOGRAPHIC`.
4. Configure the Web Service settings:
   - **Name:** `cipherlink-backend`
   - **Root Directory:** `cipherlink/backend`
   - **Environment:** `Python 3`
   - **Region:** Any close to you (e.g., Frankfurt, Oregon, Singapore)
   - **Branch:** `main`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Click **Create Web Service**.
6. Once deployed, Render will provide a public HTTPS URL, for example:
   `https://cipherlink-backend.onrender.com`

---

## Option 2: Deploy on Railway

1. Sign up at [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `CIPHERLINK-CRYPTOGRAPHIC`.
4. In **Settings**:
   - Set **Root Directory** to `/cipherlink/backend`.
   - Railway will automatically detect Python, the `requirements.txt`, and the `Dockerfile` / `Procfile`.
5. Under **Networking**, click **Generate Domain**.
6. Railway will provide a URL like:
   `https://cipherlink-backend.up.railway.app`

---

## Option 3: Deploy with Docker (Fly.io / Cloud Run / VPS)

Using the included `cipherlink/backend/Dockerfile`:

```bash
cd cipherlink/backend
docker build -t cipherlink-backend .
docker run -d -p 8000:8000 --name cipherlink cipherlink-backend
```

For **Fly.io**:
```bash
cd cipherlink/backend
fly launch
fly deploy
```

---

## Connecting Frontend to Your Deployed Backend

Once your backend is live (e.g., `https://cipherlink-backend.onrender.com`):

### Method A: In the Browser (Instant, No Rebuild Needed)
Open your browser console on `https://vinodkarri12.github.io/CIPHERLINK-CRYPTOGRAPHIC/` and run:
```javascript
localStorage.setItem('cipherlink_backend_url', 'https://cipherlink-backend.onrender.com');
location.reload();
```
To revert back to local or relative API:
```javascript
localStorage.removeItem('cipherlink_backend_url');
location.reload();
```

### Method B: Via GitHub Actions Environment Variable
1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** → **Variables**.
2. Click **New repository variable**:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://cipherlink-backend.onrender.com`
3. Trigger the GitHub Actions workflow (or push a commit). The frontend will automatically build with your remote backend URL embedded!

---

## Local Development Execution

To run the backend locally on Windows:
```powershell
cd c:\Users\vinod\python\cipherlink\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Test health endpoint:
```powershell
curl http://127.0.0.1:8000/api/health
```
Output:
```json
{"status":"ONLINE","engine":"CIPHERLINK-CRYPTO-CORE","active_curve":"SECP256R1","hardware_acceleration":true}
```
