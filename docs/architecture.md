# Technical Architecture

## 1. System Overview
The **AI Practice Assistant** (Aptitude Friend) is designed as a modular, responsive web application tailored for students, test-takers, and software engineers preparing for competitive aptitude tests, verbal reasoning assessments, and technical coding interviews.

```
[ User Browser (Desktop / Mobile Chrome / Safari) ]
                       |
       +---------------+---------------+
       |                               |
       v                               v
[ Pure Client BYOK Mode ]     [ Optional FastAPI Backend ]
       |                               |
       +---------------+---------------+
                       | (Encrypted HTTPS)
                       v
       [ Google Gemini API (2.5 Flash / 2.5 Pro) ]
```

## 2. Key Architecture Layers

### Frontend (React + Vite + TypeScript + Tailwind CSS)
- **Framework**: React 18 with Vite for rapid development and optimized tree-shaken static production builds.
- **Styling**: Tailwind CSS with custom glassmorphism and automatic dark/light theme switching.
- **State & Storage**:
  - `storageService`: Handles session storage (in-memory per tab) or local storage for the BYOK Gemini API key.
  - History & Bookmarks: Stored in browser `localStorage` / `IndexedDB` with JSON and Markdown export capabilities.
- **Screen & Camera Capture**:
  - `Screen Capture API` (`navigator.mediaDevices.getDisplayMedia`) with persistent visual status indicator, duration counter, and instant frame snapshotting.
  - `Media Devices API` (`navigator.mediaDevices.getUserMedia`) for mobile and desktop webcam question scanning.

### AI Integration (`geminiClient.ts`)
- **Direct BYOK Mode**:
  - Requests are made directly to Google Generative Language API (`/v1beta/models/{model}:generateContent`).
  - No server-side storage of user keys.
  - Structured JSON response schemas with automatic markdown fallback parser.
- **Multimodal Support**:
  - Supports image uploads (PNG, JPEG, WebP) and camera/screen frame snapshots.
  - Pre-processing OCR endpoint to transcribe images into editable text before requesting solutions.

### Optional Backend (Python FastAPI)
- Located in `backend/app/main.py`.
- Enables teams or organizations to deploy a shared service with server-owned API keys, rate limits, and authentication if desired.

## 3. Supported AI Models
- `gemini-2.5-flash`: Default recommended model for high-speed aptitude and reasoning solutions.
- `gemini-2.5-pro`: Deep reasoning model for complex algorithmic coding questions and multi-step math proofs.
- `gemini-1.5-flash`: Legacy fast model with high quota availability.
- `gemini-1.5-pro`: Long-context reasoning model.
