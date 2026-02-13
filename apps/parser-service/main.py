from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import fitz  # PyMuPDF
import re
from typing import List, Dict

app = FastAPI(title="Exam Parser Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_questions_from_text(text: str) -> List[Dict]:
    # Very basic regex-based question detection
    # Look for patterns like "Q1." or "1." or "Question 1:"
    question_pattern = re.compile(r'(?i)(?:Q|Question)?\s*(\d+)[.:]\s*(.*?)(?=(?:Q|Question)?\s*\d+[.:]|$)', re.DOTALL)
    matches = question_pattern.findall(text)
    
    questions = []
    for match in matches:
        q_num, q_text = match
        questions.append({
            "id": q_num,
            "text": q_text.strip(),
            "marks": 5, # Default mark
            "difficulty": "Medium",
            "metadata": {"original_num": q_num}
        })
    return questions

@app.get("/")
async def root():
    return {"message": "Exam Parser Service is running"}

@app.post("/parse-document")
async def parse_document(file: UploadFile = File(...)):
    content = await file.read()
    
    questions = []
    if file.filename.endswith(".pdf"):
        doc = fitz.open(stream=content, filetype="pdf")
        full_text = ""
        for page in doc:
            full_text += page.get_text()
        questions = extract_questions_from_text(full_text)
    elif file.filename.endswith(".docx"):
        # Placeholder for DOCX parsing
        # from docx import Document
        # doc = Document(io.BytesIO(content))
        # full_text = "\n".join([para.text for para in doc.paragraphs])
        # questions = extract_questions_from_text(full_text)
        pass

    return {
        "filename": file.filename,
        "questions": questions,
        "raw_text": full_text if 'full_text' in locals() else ""
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
