# Privacy, Ethical Boundaries & Academic Integrity Policy

## 1. Ethical Purpose
The **AI Practice Assistant** is engineered strictly as an educational learning companion. It is intended for:
- Self-paced homework and mock aptitude exam practice.
- Code interview preparation (e.g., LeetCode, HackerRank practice sessions).
- Authorized university or corporate tutorials where external AI tools are explicitly permitted.

## 2. Anti-Stealth & Academic Integrity Statement
This software does **NOT**:
- Provide stealth browser overlays or invisible windows.
- Evade or tamper with proctoring extensions or secure test browsers (e.g., Safe Exam Browser, Proctorio, Honorlock).
- Intercept background processes or automatically submit answers on behalf of candidates.
- Guarantee 100% correctness of AI reasoning. Users must critically evaluate all generated explanations.

## 3. Data Privacy & Bring-Your-Own-Key (BYOK) Guarantees
- **No Intermediary Storage**: When using BYOK mode, your API key and prompts are sent directly from your browser to Google AI Studio servers over HTTPS.
- **Session-First Security**: By default, API keys are stored in `sessionStorage` and destroyed the moment your browser tab closes.
- **Local History**: Solved questions, formulas, and code snippets are saved only in your device's browser `localStorage`.
- **User Control**: You can delete individual questions, clear all history, or remove your API key with a single click at any time.

## 4. Screen Sharing & Camera Permissions
- **Explicit User Action Required**: Screen sharing and camera access utilize standard HTML5 native browser permission prompts (`getDisplayMedia` / `getUserMedia`).
- **No Background Streaming**: The application does not stream your full screen to any AI service. Only individual video frames snapped via the "Capture Practice Frame" button are sent for analysis.
- **Visible Indicators**: An active sharing banner with a stop button is displayed on screen at all times while screen sharing is active.
