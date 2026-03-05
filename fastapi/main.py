from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
from io import BytesIO
import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
import warnings
import subprocess
import sys

warnings.filterwarnings("ignore", category=FutureWarning)

# Load environment variables
load_dotenv()

app = FastAPI(title="Resume Analyzer + Question Generator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to save extracted text, JSON, and questions
OUTPUT_DIR = "extracted_texts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")
groq_client = Groq(api_key=GROQ_API_KEY)


class FollowUpRequest(BaseModel):
    prev_question: str
    user_answer: str
    candidate_name: str = "Candidate"
    role: str = "Software Engineer"


class VoiceStartRequest(BaseModel):
    candidate_name: str
    role: str = "Software Engineer"


class VoiceRunRequest(BaseModel):
    candidate_name: str
    role: str = "Software Engineer"


class CodeOptimizeRequest(BaseModel):
    question: str
    language: str = "java"
    code: str
    failed_cases: list[dict] = []


VOICE_PROCESS = None


def extract_text_from_pdf(file_like: BytesIO) -> str:
    text = ""
    reader = PdfReader(file_like)
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text


def extract_text_from_scanned_pdf(file_bytes: bytes) -> str:
    pages = convert_from_bytes(file_bytes)
    text = ""
    for page in pages:
        text += pytesseract.image_to_string(page) + "\n"
    return text


async def get_structured_json(text: str) -> dict:
    prompt = f"""
    Extract all key information from the following resume text and return as structured JSON with keys:
    personal_info, education, projects, skills, summary, extracurricular_activities

    {text}
    """
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="openai/gpt-oss-120b",
    )
    llm_text = chat_completion.choices[0].message.content
    try:
        structured_json = json.loads(llm_text)
    except json.JSONDecodeError:
        structured_json = {"error": "LLM response was not valid JSON", "raw_response": llm_text}
    return structured_json


async def generate_questions_from_json(structured_json: dict) -> dict:
    prompt = f"""
    You are an interview assistant. Generate 10 relevant technical and behavioral interview questions
    based on the following resume JSON:

    {json.dumps(structured_json, indent=2)}

    Return the output as a JSON object like:
    {{
      "questions": ["Question 1", "Question 2", "..."]
    }}
    """
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="openai/gpt-oss-120b",
    )
    llm_text = chat_completion.choices[0].message.content
    try:
        questions_json = json.loads(llm_text)
    except json.JSONDecodeError:
        questions_json = {"error": "LLM response was not valid JSON", "raw_response": llm_text}
    return questions_json


def get_followup_question(prev_question: str, user_answer: str, candidate_name: str, role: str) -> str:
    prompt = f"""
You are an expert technical interviewer conducting an interview for the role of {role}.
The candidate's name is {candidate_name}.
They just answered the following question.

Question: {prev_question}
{candidate_name}'s Answer: {user_answer}

Generate ONE concise, relevant follow-up question to probe deeper into their technical skills or problem-solving ability based on their answer.
Return ONLY the question text. Do not include any conversational filler.
"""
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="openai/gpt-oss-120b",
    )
    return (chat_completion.choices[0].message.content or "").strip()


def optimize_code_solution(question: str, language: str, code: str, failed_cases: list[dict]) -> dict:
    failed_summary = "\n".join(
        [
            f"- input: {c.get('input', '')} | expected: {c.get('expectedOutput', c.get('expected', ''))} | actual: {c.get('actualOutput', c.get('actual', ''))}"
            for c in failed_cases[:5]
        ]
    )

    prompt = f"""
You are a senior competitive programming mentor.
The user submitted code in {language} and failed test cases.

Question:
{question}

Current Code:
{code}

Failed Cases:
{failed_summary if failed_summary else "- No explicit failed case details provided"}

Return ONLY valid JSON:
{{
  "optimized_code": "full corrected optimal code in {language}",
  "explanation": "short explanation of what was wrong and why this is optimal (time and space complexity included)"
}}
"""
    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="openai/gpt-oss-120b",
    )
    raw = (chat_completion.choices[0].message.content or "").strip()
    cleaned = re.sub(r"^```json\s*|^```|```$", "", raw, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        return {
            "optimized_code": code,
            "explanation": cleaned or "Could not parse model response into JSON.",
        }


@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        file_like = BytesIO(file_bytes)

        # Extract text from PDF (and OCR fallback for scanned PDFs)
        text = extract_text_from_pdf(file_like)
        if len(text.strip()) < 20:
            text = extract_text_from_scanned_pdf(file_bytes)

        filename_base = os.path.splitext(file.filename or "resume")[0]
        txt_file_path = os.path.join(OUTPUT_DIR, f"{filename_base}_extracted.txt")
        with open(txt_file_path, "w", encoding="utf-8") as f:
            f.write(text)

        # Structured JSON from LLM
        structured_json = await get_structured_json(text)
        json_file_path = os.path.join(OUTPUT_DIR, f"{filename_base}_structured.json")
        with open(json_file_path, "w", encoding="utf-8") as f:
            json.dump(structured_json, f, indent=4)

        # Interview questions from structured JSON
        questions_json = await generate_questions_from_json(structured_json)
        questions_file_path = os.path.join(OUTPUT_DIR, f"{filename_base}_questions.json")
        with open(questions_file_path, "w", encoding="utf-8") as f:
            json.dump(questions_json, f, indent=4)

        return JSONResponse(
            content={
                "filename": file.filename,
                "text_file": txt_file_path,
                "structured_json_file": json_file_path,
                "questions_file": questions_file_path,
                "structured_json": structured_json,
                "questions": questions_json,
            }
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/voice/followup")
async def voice_followup(payload: FollowUpRequest):
    try:
        print("\n========== VOICE ENGINE ==========", flush=True)
        print(f"Candidate: {payload.candidate_name} | Role: {payload.role}", flush=True)
        print(f"Question: {payload.prev_question}", flush=True)
        print(f"Answer: {payload.user_answer}", flush=True)
        followup = get_followup_question(
            prev_question=payload.prev_question,
            user_answer=payload.user_answer,
            candidate_name=payload.candidate_name,
            role=payload.role,
        )
        print(f"Generated Follow-up: {followup}", flush=True)
        print("==================================\n", flush=True)
        return JSONResponse(content={"followup": followup})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/voice/start")
async def voice_start(payload: VoiceStartRequest):
    try:
        questions_file = os.path.join(OUTPUT_DIR, f"{payload.candidate_name}_questions.json")
        if not os.path.exists(questions_file):
            return JSONResponse(
                content={"error": f"{questions_file} not found"},
                status_code=404,
            )

        with open(questions_file, "r", encoding="utf-8") as f:
            questions_data = json.load(f)

        if isinstance(questions_data.get("questions"), dict):
            question_list = questions_data.get("questions", {}).get("questions", [])
        else:
            question_list = questions_data.get("questions", [])

        print("\n========== VOICE ENGINE START ==========", flush=True)
        print(f"Candidate: {payload.candidate_name} | Role: {payload.role}", flush=True)
        print(f"Loaded questions: {len(question_list)}", flush=True)
        if question_list:
            print(f"First question: {question_list[0]}", flush=True)
        print("========================================\n", flush=True)

        return JSONResponse(
            content={
                "candidate": payload.candidate_name,
                "role": payload.role,
                "total_questions": len(question_list),
                "first_question": question_list[0] if question_list else None,
            }
        )
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/voice/run-script")
async def voice_run_script(payload: VoiceRunRequest):
    global VOICE_PROCESS
    try:
        if VOICE_PROCESS is not None and VOICE_PROCESS.poll() is None:
            return JSONResponse(
                content={"status": "already_running", "pid": VOICE_PROCESS.pid}
            )

        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dynamic_voice_interview_fixed.py")
        if not os.path.exists(script_path):
            return JSONResponse(content={"error": "dynamic_voice_interview_fixed.py not found"}, status_code=404)

        cmd = [
            sys.executable,
            "-u",
            script_path,
            "--candidate",
            payload.candidate_name,
            "--role",
            payload.role,
        ]

        # stdout/stderr inherited so question/answer logs appear in this FastAPI terminal
        VOICE_PROCESS = subprocess.Popen(cmd, cwd=os.path.dirname(script_path))
        print(f"[VOICE] Script started. pid={VOICE_PROCESS.pid}, candidate={payload.candidate_name}, role={payload.role}", flush=True)
        return JSONResponse(content={"status": "started", "pid": VOICE_PROCESS.pid})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/voice/stop-script")
async def voice_stop_script():
    global VOICE_PROCESS
    try:
        if VOICE_PROCESS is None or VOICE_PROCESS.poll() is not None:
            return JSONResponse(content={"status": "not_running"})
        VOICE_PROCESS.terminate()
        VOICE_PROCESS = None
        return JSONResponse(content={"status": "stopped"})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/code/optimize")
async def code_optimize(payload: CodeOptimizeRequest):
    try:
        result = optimize_code_solution(
            question=payload.question,
            language=payload.language,
            code=payload.code,
            failed_cases=payload.failed_cases,
        )
        print("\n========== CODE OPTIMIZER ==========", flush=True)
        print(f"Question: {payload.question[:120]}", flush=True)
        print(f"Language: {payload.language}", flush=True)
        print(f"Failed cases: {len(payload.failed_cases)}", flush=True)
        print("====================================\n", flush=True)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
