# Deployment Guide

The frontend is a static single-page application built with React, Vite, and TypeScript. It can be hosted on any static hosting provider (Vercel, Netlify, Cloudflare Pages, GitHub Pages) without needing a backend server!

---

## 1. Deploying Frontend to Vercel (Recommended)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"New Project"**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `frontend`.
5. Build settings will auto-detect:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **Deploy**. Your app will be live on a public HTTPS URL within seconds.

---

## 2. Deploying Frontend to Netlify
1. Connect your repository in [Netlify](https://netlify.com).
2. Set:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Click **Deploy**.

---

## 3. Deploying Frontend to GitHub Pages
1. In `frontend/vite.config.ts`, set `base: '/<repo-name>/'`.
2. Run `npm --prefix frontend run build`.
3. Deploy the `frontend/dist` directory to your `gh-pages` branch.

---

## 4. Deploying Optional FastAPI Backend (Render / Railway / Fly.io)
If you wish to use the Python backend (`backend/`):
1. **Host**: Deploy on Render, Railway, or Fly.io.
2. **Build Command**: `pip install -r backend/requirements.txt`
3. **Start Command**: `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variable:
   - `GEMINI_API_KEY`: Your server-owned Gemini API key (optional if using BYOK)
   - `FRONTEND_URL`: URL of your deployed frontend.
