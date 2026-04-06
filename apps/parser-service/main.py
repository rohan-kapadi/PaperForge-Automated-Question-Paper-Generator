from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import fitz  # PyMuPDF
import re
import io
import csv
from typing import List, Dict

app = FastAPI(title="Exam Parser Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def extract_questions_from_text(text: str) -> List[Dict]:
    """
    Extracts numbered questions from raw text using regex.
    Matches patterns like: Q1. / 1. / Question 1: / Q1)
    """
    question_pattern = re.compile(
        r'(?im)(?:^|\n)\s*(?:Q(?:uestion)?\s*)?(\d+)[.):\s]+\s*(.+?)(?=\n\s*(?:Q(?:uestion)?\s*)?\d+[.):\s]|$)',
        re.DOTALL
    )
    matches = question_pattern.findall(text)

    questions = []
    for q_num, q_text in matches:
        cleaned = clean_text(q_text)
        if len(cleaned) < 5:  # skip junk/empty matches
            continue
        questions.append({
            "text": cleaned,
            "marks": 5,
            "difficulty": "Medium",
            "topic": None,
            "metadata": {"original_num": q_num},
        })
    return questions


def extract_fallback(text: str) -> List[Dict]:
    """Fallback if no numbers are found: treat every non-empty line as a question."""
    questions = []
    lines = text.split('\n')
    for line in lines:
        cleaned = clean_text(line)
        if len(cleaned) > 10:  # arbitrary length to skip junk
            questions.append({
                "text": cleaned,
                "marks": 5,
                "difficulty": "Medium",
                "topic": None,
                "metadata": {"fallback": True},
            })
    return questions


def extract_from_pdf(content: bytes) -> List[Dict]:
    doc = fitz.open(stream=content, filetype="pdf")
    full_text = ""
    for page in doc:
        full_text += page.get_text()
        
    qs = extract_questions_from_text(full_text)
    return qs if len(qs) > 0 else extract_fallback(full_text)


def extract_from_docx(content: bytes) -> List[Dict]:
    from docx import Document
    doc = Document(io.BytesIO(content))
    full_text = "\n".join([para.text for para in doc.paragraphs])
    
    qs = extract_questions_from_text(full_text)
    return qs if len(qs) > 0 else extract_fallback(full_text)


def extract_from_excel(content: bytes) -> List[Dict]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active

    questions = []
    headers = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            # Normalise header names
            headers = [str(h).strip().lower() if h else "" for h in row]
            continue

        row_dict = dict(zip(headers, row))

        # Try to find the question text from common column names
        text = (
            row_dict.get("question") or row_dict.get("questions") or
            row_dict.get("q") or row_dict.get("question text") or
            list(row_dict.values())[0] if row_dict else None
        )
        if not text:
            continue

        marks_raw = row_dict.get("marks") or row_dict.get("mark") or row_dict.get("score") or 5
        try:
            marks = int(marks_raw)
        except (TypeError, ValueError):
            marks = 5

        difficulty_raw = (
            row_dict.get("difficulty") or row_dict.get("level") or "Medium"
        )
        difficulty = str(difficulty_raw).strip().capitalize()
        if difficulty not in ("Easy", "Medium", "Hard"):
            difficulty = "Medium"

        topic = str(row_dict.get("topic") or row_dict.get("unit") or row_dict.get("chapter") or "")

        questions.append({
            "text": clean_text(str(text)),
            "marks": marks,
            "difficulty": difficulty,
            "topic": topic or None,
            "metadata": {},
        })
    return questions


def extract_from_csv(content: bytes) -> List[Dict]:
    decoded = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(decoded))
    questions = []

    for row in reader:
        # Normalise keys
        row_lower = {k.strip().lower(): v for k, v in row.items() if k}

        text = (
            row_lower.get("question") or row_lower.get("questions") or
            row_lower.get("q") or row_lower.get("question text") or
            next(iter(row_lower.values()), None)
        )
        if not text:
            continue

        marks_raw = row_lower.get("marks") or row_lower.get("mark") or row_lower.get("score") or 5
        try:
            marks = int(marks_raw)
        except (TypeError, ValueError):
            marks = 5

        difficulty_raw = row_lower.get("difficulty") or row_lower.get("level") or "Medium"
        difficulty = str(difficulty_raw).strip().capitalize()
        if difficulty not in ("Easy", "Medium", "Hard"):
            difficulty = "Medium"

        topic = str(row_lower.get("topic") or row_lower.get("unit") or row_lower.get("chapter") or "")

        questions.append({
            "text": clean_text(str(text)),
            "marks": marks,
            "difficulty": difficulty,
            "topic": topic or None,
            "metadata": {},
        })
    return questions


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "Exam Parser Service is running", "version": "2.0"}


@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".pdf"):
            questions = extract_from_pdf(content)
        elif filename.endswith(".docx"):
            questions = extract_from_docx(content)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            questions = extract_from_excel(content)
        elif filename.endswith(".csv"):
            questions = extract_from_csv(content)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Supported: PDF, DOCX, XLSX, XLS, CSV"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")

    return {
        "filename": file.filename,
        "total_questions": len(questions),
        "questions": questions,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
