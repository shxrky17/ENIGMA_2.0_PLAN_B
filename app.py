from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
from io import BytesIO
import os
import json
from groq import Groq
from dotenv import load_dotenv
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)

# --- Load environment variables ---
load_dotenv()

app = FastAPI(title="Resume Analyzer + Question Generator")

# Directory to save extracted text, JSON, and questions
OUTPUT_DIR = "extracted_texts"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file!")
groq_client = Groq(api_key=GROQ_API_KEY)

# --- PDF Text Extraction Functions ---
def extract_text_from_pdf(file_like):
    text = ""
    reader = PdfReader(file_like)
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_scanned_pdf(file_bytes):
    pages = convert_from_bytes(file_bytes)
    text = ""
    for page in pages:
        text += pytesseract.image_to_string(page) + "\n"
    return text

# --- Function to call Groq LLM for structured JSON ---
async def get_structured_json(text: str):
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

# --- Function to generate questions from structured JSON ---
async def generate_questions_from_json(structured_json: dict):
    prompt = f"""
    You are an interview assistant. Generate 10 relevant technical and behavioral interview questions
    based on the following resume JSON:

    {json.dumps(structured_json, indent=2)}

    Return the output as a JSON list like:
    {{
      "questions": ["Question 1", "Question 2", ...]
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

# --- Endpoint: Full pipeline ---
@app.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        file_like = BytesIO(file_bytes)

        # --- Extract text from PDF ---
        text = extract_text_from_pdf(file_like)
        if len(text.strip()) < 20:
            text = extract_text_from_scanned_pdf(file_bytes)

        # --- Save extracted text ---
        filename_base = os.path.splitext(file.filename)[0]
        txt_file_path = os.path.join(OUTPUT_DIR, f"{filename_base}_extracted.txt")
        with open(txt_file_path, "w", encoding="utf-8") as f:
            f.write(text)

        # --- Get structured JSON from LLM ---
        structured_json = await get_structured_json(text)
        json_file_path = os.path.join(OUTPUT_DIR, f"{filename_base}_structured.json")
        with open(json_file_path, "w", encoding="utf-8") as f:
            json.dump(structured_json, f, indent=4)

        # --- Generate interview questions ---
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
                "questions": questions_json
            }
        )

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)