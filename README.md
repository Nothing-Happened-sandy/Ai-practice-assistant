# AI Practice Assistant (Aptitude Friend)

> A responsive web application and phone companion powered by Google's Gemini API for quantitative aptitude, logical reasoning, verbal ability, and coding interview preparation.

Built strictly in accordance with the `AI_Practice_Assistant_Project_Specification.docx` specification.

---

## 🌟 Key Features

### 1. Aptitude & Verbal Question Solver
- **Flexible Input Modes**:
  - **Typed / Pasted text**: Formats complex equations and math word problems.
  - **Image Upload**: Drag & drop or paste from clipboard (`Ctrl+V`).
  - **Live Camera Scanner**: Snap photos of textbook or mock test questions with front/back camera switching.
  - **OCR Pre-Processing**: Transcribe questions into editable text via Gemini Vision to fix blurry terms before solving.
- **Structured Answers**:
  - Highlighted correct multiple-choice option (A, B, C, D).
  - Step-by-step mathematical reasoning.
  - Quick speed-math formulas and tricks.
  - Verification sanity checks and model confidence notes.
  - Text-to-Speech audio reader so you can listen to explanations hands-free.

### 2. Coding Practice & Algorithm Lab
- Multi-language support: Python, JavaScript, TypeScript, Java, C++, C, SQL, Go.
- Generates optimal algorithms with Big-O Time and Space complexities.
- **Code Debugger**: Paste your draft attempt to identify logical bugs and edge-case failures.
- **Edge-Case Generator**: Generates tricky test cases (empty, negative, upper constraint limits).
- In-browser sandbox JavaScript runner for instant verification.

### 3. Screen Companion (PC-to-Phone)
- User-initiated browser Screen Capture (`navigator.mediaDevices.getDisplayMedia`).
- Persistent red recording indicator with live duration timer and instant **Stop** button.
- **Frame Grabber**: Snap a frame of a question directly from the screen and send it straight to the solver.
- Local network pairing code for reviewing on mobile phones over the same Wi-Fi.

### 4. Bring-Your-Own-Key (BYOK) Security
- Link to official Google AI Studio key dashboard: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
- Password field with show/hide toggle.
- Real-time **"Test Key"** latency ping test.
- Choice between in-memory `sessionStorage` (erased on tab close) or `localStorage`.
- No user keys are stored in a database or committed to Git.

### 5. Practice Notebook & History
- Automatic local persistence of solved questions.
- Search by keyword, filter by category (Aptitude, Logical, Verbal, Coding), and star favorites.
- One-click export to **Markdown (`.md`)** for study notes or **JSON** for backups.

### 6. Ethical Integrity & Privacy
- Prominent disclaimers: Built for authorized study, homework, and mock assessments.
- No stealth windows, no tab-switching evasion, and no proctor-defeating features.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Running the App Locally

1. **Install dependencies** (already installed in `frontend`):
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```
   Or from the root directory:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`.

4. Click **"Set API Key"** in the top navigation bar, enter your Gemini API key, click **"Test Key"**, and save.

5. You are ready to solve practice questions!

---

## 📁 Repository Structure

```
├── frontend/                     # React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Coding/          # Coding lab, debugger, test case generator
│   │   │   ├── Companion/       # Screen capture & phone pairing
│   │   │   ├── History/         # Practice notebook & export
│   │   │   ├── Settings/        # Gemini BYOK configuration modal
│   │   │   ├── Workspace/       # Question solver, camera, OCR, solution card
│   │   │   ├── common/          # Toasts, privacy disclaimer banner
│   │   │   └── Navbar.tsx       # Navigation & theme controls
│   │   ├── services/
│   │   │   ├── geminiClient.ts  # Direct Gemini API integration (Flash/Pro)
│   │   │   ├── storageService.ts# LocalStorage / SessionStorage manager
│   │   │   └── screenShareService.ts # Screen capture API manager
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # Main application shell
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Tailwind CSS styling
│   ├── package.json
│   └── vite.config.ts
├── backend/                      # Optional Python FastAPI server
│   ├── app/
│   │   └── main.py              # Server-side proxy endpoints
│   └── requirements.txt
├── docs/                         # Documentation
│   ├── architecture.md          # Architecture and data flow
│   ├── privacy.md               # Ethical boundaries and privacy policy
│   └── deployment.md            # Deployment guides for Vercel, Netlify, etc.
├── AI_Practice_Assistant_Project_Specification.docx # Original specification
├── package.json                  # Root runner script
├── .gitignore
├── .env.example
└── README.md
```

---

## 🧪 Minimum Viable Product Verification

- [x] Responsive layout on Desktop, Tablet, and Mobile.
- [x] Bring-Your-Own-Key configuration with Google AI Studio link.
- [x] Latency ping test for API keys.
- [x] Text / Pasted question solving with step-by-step breakdown.
- [x] Image upload (drag-and-drop & clipboard paste).
- [x] HTML5 Camera question scanning with flip/mirror controls.
- [x] Gemini Vision OCR transcription before solving.
- [x] Coding practice mode with Big-O time and space complexity.
- [x] Browser-based Screen Capture with live frame grabber.
- [x] Local practice notebook with JSON & Markdown export.
- [x] Ethical practice and privacy notice modals.
