from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
from pdf2image import convert_from_bytes
import pytesseract
from io import BytesIO  # <-- add this

app = FastAPI(title="PDF Text Extractor")

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

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        file_like = BytesIO(file_bytes)  # <-- wrap bytes

        # Try text extraction first
        text = extract_text_from_pdf(file_like)

        # If very little text, fallback to OCR
        if len(text.strip()) < 20:
            text = extract_text_from_scanned_pdf(file_bytes)

        return JSONResponse(content={"filename": file.filename, "text": text})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)