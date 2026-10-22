"""
Optional FastAPI Backend for AI Practice Assistant.
Provides server-side proxy for Gemini API when not running in browser BYOK mode.
"""

from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Practice Assistant API",
    description="Educational question solving and coding assistance proxy powered by Google Gemini",
    version="1.0.0",
)

# Configure CORS for frontend access
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    os.getenv("FRONTEND_URL", "*"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


class QuestionSolveRequest(BaseModel):
    questionText: str
    imageBase64: Optional[str] = None
    questionType: str = "auto"
    choices: Optional[List[str]] = None
    userInstructions: Optional[str] = None
    model: str = "gemini-2.5-flash"


class CodingSolveRequest(BaseModel):
    language: str
    problemTitle: Optional[str] = ""
    problemStatement: str
    constraints: Optional[str] = ""
    sampleInput: Optional[str] = ""
    sampleOutput: Optional[str] = ""
    userCodeDraft: Optional[str] = None
    mode: str = "solve"
    model: str = "gemini-2.5-flash"


def get_effective_api_key(x_gemini_api_key: Optional[str] = Header(None)) -> str:
    key = x_gemini_api_key or GEMINI_API_KEY
    if not key:
        raise HTTPException(
            status_code=401,
            detail="Gemini API key is required. Supply via X-Gemini-Api-Key header or server environment.",
        )
    return key


@app.get("/")
def read_root():
    return {
        "app": "AI Practice Assistant Backend",
        "status": "online",
        "notice": "For educational mock tests and practice only.",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/api/solve")
async def solve_question(req: QuestionSolveRequest, api_key: str = Depends(get_effective_api_key)):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{req.model}:generateContent?key={api_key}"

    parts = []
    if req.imageBase64:
        clean_base64 = req.imageBase64.split(",")[-1]
        parts.append({
            "inlineData": {
                "mimeType": "image/jpeg",
                "data": clean_base64,
            }
        })

    prompt_body = f"Category: {req.questionType.upper()}\nQuestion: {req.questionText}\n"
    if req.choices:
        prompt_body += "Choices:\n" + "\n".join([f"{chr(65+i)}) {c}" for i, c in enumerate(req.choices)])
    if req.userInstructions:
        prompt_body += f"\nNote: {req.userInstructions}"

    parts.append({"text": prompt_body})

    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
