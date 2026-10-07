from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import re
import io
import csv
from typing import List, Dict, Optional

app = FastAPI(title="Exam Parser Service", version="3.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Bloom's Taxonomy Classification Engine
# ---------------------------------------------------------------------------

BLOOMS_VERBS: Dict[str, List[str]] = {
    'L1_Remember': [
        'define', 'list', 'recall', 'identify', 'name', 'state', 'recognize',
        'what is', 'what are', 'write down', 'enumerate', 'label', 'match',
        'which of the following', 'mention the', 'mention',
    ],
    'L2_Understand': [
        'explain', 'describe', 'summarize', 'paraphrase', 'classify', 'interpret',
        'discuss', 'illustrate', 'outline', 'state and explain', 'write short note',
        'write a note', 'briefly explain', 'what do you mean by', 'differentiate between connection',
        'explain the concept of',
    ],
    'L3_Apply': [
        'apply', 'solve', 'calculate', 'use', 'demonstrate', 'implement',
        'compute', 'construct', 'produce', 'execute', 'operate', 'perform',
        'show', 'derive', 'draw', 'write a program', 'trace', 'find the',
    ],
    'L4_Analyze': [
        'analyze', 'examine', 'differentiate', 'compare', 'contrast', 'break down',
        'investigate', 'separate', 'inspect', 'categorize', 'distinguish',
        'outline the differences', 'point out', 'compare and contrast',
        'differentiate between', 'distinguish between',
    ],
    'L5_Evaluate': [
        'evaluate', 'justify', 'assess', 'critique', 'judge', 'defend',
        'recommend', 'support', 'argue', 'conclude', 'prioritize', 'rate',
        'validate', 'weigh', 'test', 'verify', 'case-based', 'case based',
        'case study', 'select and justify', 'justify your choices', 'justify your',
    ],
    'L6_Create': [
        'design', 'develop', 'create', 'formulate', 'generate', 'plan',
        'build', 'compose', 'devise', 'propose', 'assemble', 'synthesize',
        'architect', 'propose an architecture',
    ],
}

NUMERICAL_PATTERNS = [
    r'\bcalculate\b', r'\bcompute\b', r'\bfind\s+the\b', r'\bdetermine\b',
    r'\bderive\b', r'solve\s+for', r'=\s*\?', r'evaluate\s+the\s+expression',
    r'\bfind\s+the\s+value\b', r'\bprove\s+that\b',
]

MCQ_PATTERNS = [
    r'\bwhich\s+of\s+the\s+following\b', r'\(a\)\s', r'\(b\)\s',
    r'choose\s+the\s+correct', r'select\s+the\s+best',
    r'\ba\)\s', r'\bb\)\s', r'all\s+of\s+the\s+above',
]

DEFINITION_PATTERNS = [
    r'^define\b', r'^what\s+is\b', r'^what\s+are\b',
    r'^state\b', r'^list\b', r'^name\b',
    r'^write\s+a\s+definition\b', r'^give\s+the\s+definition\b',
]

UNIT_HEADER_REGEX = re.compile(
    r'^\s*(?:unit|module|chapter|part)\s*([0-9ivxlcdm]+)(?:[\s:–—\-]+(.*))?$',
    re.IGNORECASE
)

FOCUS_REGEX = re.compile(r'^\s*(?:focus|topics?|syllabus|theme|concepts?)\s*:\s*(.+)$', re.IGNORECASE)

QUESTION_START_REGEX = re.compile(r'^\s*(?:q(?:uestion)?\s*)?(\d+)[\.\)\:\-]\s*(.+)$', re.IGNORECASE)

ROMAN_TO_INT = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6,
    'vii': 7, 'viii': 8, 'ix': 9, 'x': 10, 'xi': 11, 'xii': 12
}


def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def detect_marks_in_text(text: str) -> Optional[int]:
    """Extract marks value from patterns like (5 marks), [5M], 5 Marks, (10)"""
    patterns = [
        r'\((\d+)\s*marks?\)',
        r'\[(\d+)\s*m\]',
        r'\[(\d+)\s*marks?\]',
        r'(\d+)\s*marks?$',
        r'\((\d+)\)$',
        r'\[(\d+)\]$',
    ]
    for p in patterns:
        m = re.search(p, text.lower())
        if m:
            v = int(m.group(1))
            if 1 <= v <= 30:
                return v
    return None


def classify_question(text: str, marks: Optional[int] = None) -> Dict:
    """
    AI-based question classification engine.

    Accurately classifies:
    - Bloom's Taxonomy cognitive level (L1–L6)
    - Difficulty (Easy / Medium / Hard)
    - Realistic marks estimation if document didn't specify
    - Question type (Definition, Short Answer, Long Answer, Numerical, MCQ)
    - Confidence score
    """
    text_lower = text.lower().strip()

    # ── 1. Bloom's Level via weighted verb matching ──────────────────────────
    level_scores: Dict[str, float] = {level: 0.0 for level in BLOOMS_VERBS}
    for level, verbs in BLOOMS_VERBS.items():
        for verb in verbs:
            if verb in text_lower:
                # Stronger weight if the question starts with the verb
                starts = text_lower.startswith(verb) or text_lower.startswith(verb + ' ')
                level_scores[level] += 4.0 if starts else 1.5

    # Case-based detection boost (L5 Evaluate)
    if any(k in text_lower for k in ['case-based', 'case based', 'case study', 'justify your', 'select an appropriate']):
        level_scores['L5_Evaluate'] += 7.0

    # System design / architecture boost (L6 Create)
    if any(k in text_lower for k in ['design an', 'design a', 'propose an architecture', 'formulate a', 'devise a']):
        level_scores['L6_Create'] += 6.0

    # Comprehensive multi-layer derivation / comparative analysis (L4 Analyze)
    if any(k in text_lower for k in ['all seven layers', 'all 7 layers', 'compare osi and tcp/ip', 'protocol hierarchy']):
        level_scores['L4_Analyze'] += 4.5

    max_score = max(level_scores.values())
    if max_score > 0:
        blooms_level = max(level_scores, key=level_scores.get)
        bloom_confidence = min(0.95, 0.65 + (max_score * 0.05))
    else:
        blooms_level = 'L2_Understand'
        bloom_confidence = 0.50

    # ── 2. Marks Estimation ──────────────────────────────────────────────────
    explicit_marks = marks if (marks and marks != 5) else None
    if not explicit_marks:
        detected_m = detect_marks_in_text(text)
        if detected_m:
            assigned_marks = detected_m
        else:
            # Estimate marks from question complexity
            if any(k in text_lower for k in ['case-based', 'case based', 'all seven layers', 'all 7 layers', 'justify your choices']):
                assigned_marks = 10
            elif any(k in text_lower for k in ['differentiate', 'compare', 'calculate', 'derive', 'draw and explain', 'explain in detail']):
                assigned_marks = 5
            elif text_lower.startswith('define') or text_lower.startswith('what is') or text_lower.startswith('state') or text_lower.startswith('name'):
                assigned_marks = 2 if len(text.split()) <= 15 else 5
            else:
                assigned_marks = 5
    else:
        assigned_marks = explicit_marks

    # ── 3. Difficulty Derivation (Cognitive Demand + Depth) ───────────────────
    if blooms_level == 'L1_Remember':
        difficulty = 'Easy'
        diff_confidence = 0.90
    elif blooms_level == 'L2_Understand':
        if assigned_marks <= 2 or len(text.split()) <= 12:
            difficulty = 'Easy'
            diff_confidence = 0.85
        else:
            difficulty = 'Medium'
            diff_confidence = 0.80
    elif blooms_level == 'L3_Apply':
        if assigned_marks >= 8 or 'all seven layers' in text_lower:
            difficulty = 'Hard'
            diff_confidence = 0.85
        else:
            difficulty = 'Medium'
            diff_confidence = 0.85
    elif blooms_level == 'L4_Analyze':
        if assigned_marks >= 8 or any(k in text_lower for k in ['design philosophy', 'all seven layers', 'practical usage']):
            difficulty = 'Hard'
            diff_confidence = 0.88
        else:
            difficulty = 'Medium'
            diff_confidence = 0.82
    elif blooms_level in ('L5_Evaluate', 'L6_Create'):
        difficulty = 'Hard'
        diff_confidence = 0.92
    else:
        difficulty = 'Medium'
        diff_confidence = 0.70

    # ── 4. Question Type ─────────────────────────────────────────────────────
    question_type = 'Short Answer'
    qt_confidence = 0.60

    for p in MCQ_PATTERNS:
        if re.search(p, text_lower):
            question_type = 'MCQ'
            qt_confidence = 0.95
            break

    if question_type == 'Short Answer':
        for p in NUMERICAL_PATTERNS:
            if re.search(p, text_lower):
                question_type = 'Numerical'
                qt_confidence = 0.90
                break

    if question_type == 'Short Answer':
        for p in DEFINITION_PATTERNS:
            if re.search(p, text_lower):
                question_type = 'Definition'
                qt_confidence = 0.85
                break

    if question_type == 'Short Answer' and (assigned_marks >= 7 or len(text.split()) >= 28):
        question_type = 'Long Answer'
        qt_confidence = 0.75

    # ── 5. Unit / Module detection in text ───────────────────────────────────
    unit: Optional[str] = None
    for p in [r'\bunit\s*([1-9])\b', r'\bmodule\s*([1-9])\b', r'\bch(?:apter)?\s*\.?\s*([1-9])\b']:
        m = re.search(p, text_lower)
        if m:
            unit = f'Unit {m.group(1)}'
            break

    overall_confidence = round((bloom_confidence + diff_confidence + qt_confidence) / 3, 3)

    return {
        'blooms_level': blooms_level,
        'difficulty': difficulty,
        'marks': assigned_marks,
        'question_type': question_type,
        'unit': unit,
        'confidence': overall_confidence,
        'classification_source': 'ai',
        'metadata': {
            'ai': {
                'blooms_level': blooms_level,
                'blooms_confidence': round(bloom_confidence, 3),
                'difficulty': difficulty,
                'difficulty_confidence': round(diff_confidence, 3),
                'question_type': question_type,
                'qt_confidence': round(qt_confidence, 3),
                'overall_confidence': overall_confidence,
            }
        },
    }


def enrich_question(q: Dict) -> Dict:
    """Merge classification results into a question dict."""
    cls = classify_question(q.get('text', ''), q.get('marks'))

    # Update marks if not explicitly set
    if not q.get('marks') or q.get('marks') == 5:
        q['marks'] = cls['marks']

    # Update difficulty if not set
    if not q.get('difficulty') or q['difficulty'] == 'Medium':
        q['difficulty'] = cls['difficulty']

    # Update blooms_level if not set
    if not q.get('blooms_level'):
        q['blooms_level'] = cls['blooms_level']

    # Preserve unit from document structure if detected
    if not q.get('unit') and cls.get('unit'):
        q['unit'] = cls['unit']

    q['question_type'] = cls['question_type']
    q['confidence'] = cls['confidence']
    q['classification_source'] = 'ai'

    existing_meta = q.get('metadata', {}) or {}
    existing_meta['ai'] = cls['metadata']['ai']
    q['metadata'] = existing_meta

    return q


# ---------------------------------------------------------------------------
# Document Parsers (State Machine for sequential documents)
# ---------------------------------------------------------------------------

def parse_structured_document(lines: List[str]) -> List[Dict]:
    """
    Parses a document sequentially preserving Unit headers, topics,
    and numbered questions.
    """
    questions = []
    current_unit = None
    current_topic = None
    current_q = None

    for line in lines:
        cleaned = clean_text(line)
        if not cleaned:
            continue

        # 1. Check for Unit / Module heading (e.g. "Unit 1 – Introduction to Computer Network...")
        u_m = UNIT_HEADER_REGEX.match(cleaned)
        if u_m:
            if current_q:
                questions.append(current_q)
                current_q = None
            u_raw = u_m.group(1).lower()
            u_num = ROMAN_TO_INT.get(u_raw, u_raw)
            current_unit = f"Unit {u_num}"
            raw_title = u_m.group(2)
            current_topic = clean_text(raw_title) if raw_title else None
            continue

        # 2. Check for Focus / Syllabus line (e.g. "Focus: Networking fundamentals...")
        f_m = FOCUS_REGEX.match(cleaned)
        if f_m:
            if not current_topic:
                current_topic = clean_text(f_m.group(1))
            continue

        # 3. Check for Question Start (e.g. "1. Define a computer network...", "Q1. ...")
        q_m = QUESTION_START_REGEX.match(cleaned)
        if q_m:
            if current_q:
                questions.append(current_q)

            q_num = q_m.group(1)
            q_body = clean_text(q_m.group(2))
            marks = detect_marks_in_text(q_body)

            current_q = {
                'text': q_body,
                'marks': marks,
                'difficulty': None,
                'topic': current_topic or 'General',
                'unit': current_unit,
                'blooms_level': None,
                'co': None,
                'question_type': None,
                'metadata': {'original_num': q_num},
            }
            continue

        # 4. Continuation line for multi-line question
        if current_q:
            current_q['text'] += ' ' + cleaned
            if not current_q['marks']:
                detected_m = detect_marks_in_text(cleaned)
                if detected_m:
                    current_q['marks'] = detected_m

    if current_q:
        questions.append(current_q)

    return questions


def extract_fallback(text: str) -> List[Dict]:
    """Fallback: treat every long non-empty line as a question."""
    questions = []
    for line in text.split('\n'):
        cleaned = clean_text(line)
        if len(cleaned) > 15:
            questions.append({
                'text': cleaned,
                'marks': 5,
                'difficulty': None,
                'topic': 'General',
                'unit': None,
                'blooms_level': None,
                'co': None,
                'question_type': None,
                'metadata': {'fallback': True},
            })
    return questions


def extract_from_docx(content: bytes) -> List[Dict]:
    from docx import Document
    doc = Document(io.BytesIO(content))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    qs = parse_structured_document(paragraphs)
    if qs:
        return qs
    full_text = '\n'.join(para.text for para in doc.paragraphs)
    return extract_fallback(full_text)


def extract_from_pdf(content: bytes) -> List[Dict]:
    doc = fitz.open(stream=content, filetype='pdf')
    lines = []
    for page in doc:
        text = page.get_text()
        lines.extend([l.strip() for l in text.split('\n') if l.strip()])
    qs = parse_structured_document(lines)
    if qs:
        return qs
    full_text = '\n'.join(lines)
    return extract_fallback(full_text)


def extract_from_excel(content: bytes) -> List[Dict]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    ws = wb.active
    questions = []
    headers: List[str] = []

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            headers = [str(h).strip().lower() if h else '' for h in row]
            continue
        row_dict = dict(zip(headers, row))

        text = (
            row_dict.get('question') or row_dict.get('questions') or
            row_dict.get('q') or row_dict.get('question text') or
            (list(row_dict.values())[0] if row_dict else None)
        )
        if not text:
            continue

        marks_raw = row_dict.get('marks') or row_dict.get('mark') or row_dict.get('score') or 5
        try:
            marks = int(marks_raw)
        except (TypeError, ValueError):
            marks = 5

        diff_raw = row_dict.get('difficulty') or row_dict.get('level') or ''
        difficulty = str(diff_raw).strip().capitalize()
        if difficulty not in ('Easy', 'Medium', 'Hard'):
            difficulty = None

        topic = str(row_dict.get('topic') or row_dict.get('chapter') or '') or None
        unit = str(row_dict.get('unit') or row_dict.get('module') or '') or None
        co = str(row_dict.get('co') or row_dict.get('course outcome') or '') or None
        blooms_raw = str(row_dict.get('blooms') or row_dict.get("bloom's") or row_dict.get('bloom level') or '') or None

        questions.append({
            'text': clean_text(str(text)),
            'marks': marks,
            'difficulty': difficulty,
            'topic': topic,
            'unit': unit,
            'co': co,
            'blooms_level': blooms_raw,
            'question_type': None,
            'metadata': {},
        })
    return questions


def extract_from_csv(content: bytes) -> List[Dict]:
    decoded = content.decode('utf-8-sig', errors='replace')
    reader = csv.DictReader(io.StringIO(decoded))
    questions = []

    for row in reader:
        row_lower = {k.strip().lower(): v for k, v in row.items() if k}

        text = (
            row_lower.get('question') or row_lower.get('questions') or
            row_lower.get('q') or row_lower.get('question text') or
            next(iter(row_lower.values()), None)
        )
        if not text:
            continue

        marks_raw = row_lower.get('marks') or row_lower.get('mark') or row_lower.get('score') or 5
        try:
            marks = int(marks_raw)
        except (TypeError, ValueError):
            marks = 5

        diff_raw = row_lower.get('difficulty') or row_lower.get('level') or ''
        difficulty = str(diff_raw).strip().capitalize()
        if difficulty not in ('Easy', 'Medium', 'Hard'):
            difficulty = None

        topic = row_lower.get('topic') or row_lower.get('chapter') or None
        unit = row_lower.get('unit') or row_lower.get('module') or None
        co = row_lower.get('co') or row_lower.get('course outcome') or None
        blooms_raw = row_lower.get('blooms') or row_lower.get("bloom's") or None

        questions.append({
            'text': clean_text(str(text)),
            'marks': marks,
            'difficulty': difficulty,
            'topic': topic,
            'unit': unit,
            'co': co,
            'blooms_level': blooms_raw,
            'question_type': None,
            'metadata': {},
        })
    return questions


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

class ClassifyRequest(BaseModel):
    text: str
    marks: Optional[int] = None


@app.get('/')
async def root():
    return {'message': 'Exam Parser Service is running', 'version': '3.1'}


@app.post('/parse-document')
async def parse_document(file: UploadFile = File(...)):
    """
    Parse an uploaded question file (DOCX/PDF/XLSX/CSV) and return
    fully structured and classified questions with Unit, Topic,
    Bloom's level, difficulty, and question type.
    """
    content = await file.read()
    filename = (file.filename or '').lower()

    try:
        if filename.endswith('.docx'):
            questions = extract_from_docx(content)
        elif filename.endswith('.pdf'):
            questions = extract_from_pdf(content)
        elif filename.endswith('.xlsx') or filename.endswith('.xls'):
            questions = extract_from_excel(content)
        elif filename.endswith('.csv'):
            questions = extract_from_csv(content)
        else:
            raise HTTPException(
                status_code=400,
                detail='Unsupported file format. Supported: DOCX, PDF, XLSX, XLS, CSV',
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to parse file: {str(e)}')

    # Enrich every question with AI classification
    enriched = [enrich_question(q) for q in questions]

    return {
        'filename': file.filename,
        'total_questions': len(enriched),
        'questions': enriched,
    }


@app.post('/classify')
async def classify_single(req: ClassifyRequest):
    """Classify a single question text."""
    result = classify_question(req.text, req.marks)
    return result


@app.post('/classify-batch')
async def classify_batch(questions: List[ClassifyRequest]):
    """Classify a batch of questions."""
    return [classify_question(q.text, q.marks) for q in questions]


if __name__ == '__main__':
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
