# FastAPI Resume Analyzer

## Setup

```powershell
cd fastapi
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add your key in `.env`:

```env
GROQ_API_KEY=...
```

## Run

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoint

- `POST /analyze-resume`
- `multipart/form-data` with field name: `file`
