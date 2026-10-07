# PaperForge: Engineering College Exam Paper Generation System
## Production Implementation Plan & Engineering Roadmap

This document defines the architecture, current implementation progress, and step-by-step engineering roadmap to make PaperForge a **production-ready examination paper generator** suitable for actual deployment in an Engineering College for **Unit Tests (Internal Assessments)** and **Final Semester Examinations**.

---

## 🏛️ System Architecture

```text
[Frontend: Next.js (App Router)]  <─── REST / JWT ───>  [Backend API: NestJS]
                 │                                                │
                 ├── Supabase Auth & Session                      ├── Supabase Client (PostgreSQL + RLS)
                 └── Zustand (Client State)                       ├── Microservice Proxy to FastAPI
                                                                  └── PDF / DOCX Generation Engine
                                                                          │
                                                                          ▼
                                                              [Parser Service: FastAPI (Python)]
                                                              (PDF, DOCX, XLSX, CSV Question Ingestion)
```

- **Frontend (`apps/frontend`)**: Next.js 16 (App Router), Tailwind CSS, Framer Motion, Zustand.
- **Backend API (`apps/backend-api`)**: NestJS, `@supabase/supabase-js`, RBAC Guards, REST v1 endpoints.
- **Parser Microservice (`apps/parser-service`)**: FastAPI (Python), `PyMuPDF`, `python-docx`, `openpyxl`.
- **Database & Auth**: Supabase (PostgreSQL 15+), Row-Level Security (RLS) for departmental isolation.
- **Document Export**: PDF (print-ready A4 with official college headers) and DOCX (editable for faculty).

---

## 📊 Current Progress & Codebase Audit

| Component | Completion | Reality Check / Current State |
|---|:---:|---|
| **Frontend UI** | **~85%** | Landing, Auth, Dashboard, Upload UI, Library, Blueprint Builder, Manual Selection, Preview, and Audit UI exist with styled mock states. |
| **Parser Service** | **~90%** | **Fully supports PDF, DOCX, XLSX, and CSV** via `apps/parser-service/main.py`. Virtual environment standardized at `.venv`. |
| **Database Schema** | **~90%** | Comprehensive engineering schema created in `supabase_schema.sql` (NBA COs, Bloom levels, multi-set, RLS). Ready to apply. |
| **Backend API** | **~25%** | Basic NestJS server running with Supabase connection module and basic questions endpoints. |
| **End-to-End Flow** | **~20%** | Services run independently but need backend orchestration to connect Frontend $\to$ Parser $\to$ Supabase $\to$ PDF. |

---

## 🎓 College Production-Grade Requirements (Must-Haves)

To be certified for actual processing of real college exams, the system adheres to the following standards:

1. **NBA / NAAC Accreditation Compliance**:
   - Every question must carry a **Course Outcome (CO)** tag (e.g. `CO1`, `CO2`, `CO3`).
   - Every question must carry a **Bloom's Taxonomy Level** (`L1_Remember` to `L6_Create`).
   - Generated papers display CO and Bloom levels in the marks column.
2. **Engineering Exam Formatting**:
   - **Formulas / Math**: LaTeX / KaTeX rendering support in questions.
   - **Diagrams / Schematics**: Questions support optional image attachments (`image_url`).
   - **Sub-Questions**: Support multipart questions (e.g., `Q1.(a) [5M]`, `Q1.(b) [5M]`).
3. **Multi-Set Generation (Set A / Set B)**:
   - Automated generation of 2 or 3 parallel, balanced sets from the same blueprint to prevent copying.
4. **Examination Cell Workflow**:
   - Status pipeline: `Draft` $\to$ `Submitted_For_Review` $\to$ `Approved` (by HOD) $\to$ `Generated` (locked for printing).
5. **Dual Export**:
   - **PDF**: Pixel-perfect A4 printable layout with college seal, instructions, and signatures.
   - **DOCX**: Editable Microsoft Word document for professors to make final formatting adjustments.

---

## 🗓 Production Implementation Roadmap

### Phase 1: Database Setup & Supabase Auth Integration
> **Objective**: Apply the complete schema and activate real department-scoped authentication.

- [ ] Execute [supabase_schema.sql](file:///c:/Rohan/Projects/Mini%20Project/supabase_schema.sql) in Supabase SQL Editor.
- [ ] Configure environment variables in `apps/backend-api/.env` and `apps/frontend/.env.local`:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Seed initial departments: `Computer Engineering`, `Information Technology`, `Mechanical`, `Civil`, `E&TC`.
- [ ] Verify Supabase Auth:
  - Faculty signup/login saves user profile to `profiles` with `department_id` and `role`.
  - NestJS JWT Auth Guard validates incoming Bearer token and extracts `user_id`, `department_id`, and `role`.

---

### Phase 2: Ingestion & Question Bank Pipeline (Frontend $\to$ Backend $\to$ Parser $\to$ DB)
> **Objective**: Allow faculty to upload question files (PDF/DOCX/Excel/CSV) and save questions into subject banks.

- [ ] **Backend Ingestion Module (`apps/backend-api/src/ingest`)**:
  - `POST /ingest/upload`: Receives file $\to$ streams to `http://localhost:8000/parse-document` $\to$ returns parsed question JSON to UI.
  - `POST /ingest/commit`: Receives reviewed questions from faculty $\to$ inserts batch into `questions` table under selected `bank_id`.
- [ ] **Frontend Workbench (`apps/frontend/app/dashboard/upload/page.tsx`)**:
  - Connect upload form to `POST /ingest/upload`.
  - Allow faculty to edit parsed questions (adjust marks, select CO, Bloom level, topic) before clicking **Save to Question Bank**.
- [ ] **Question Library (`apps/frontend/app/dashboard/library/page.tsx`)**:
  - Fetch real questions from Supabase filtered by subject bank, difficulty, and CO.
  - Add / edit / delete question modal.

---

### Phase 3: Blueprint Engine (Unit Tests vs Final Exams)
> **Objective**: Create flexible templates matching standard engineering university patterns.

- [ ] **Backend Blueprints Module (`apps/backend-api/src/blueprints`)**:
  - CRUD endpoints for `exam_blueprints`.
  - Built-in templates:
    - **Unit Test Template**: Total 20/30 Marks, 1 Hour, 2 Sections (Short answer + Long answer).
    - **End-Sem Final Exam Template**: Total 60/70/80 Marks, 3 Hours, 4-5 Modules with compulsory Q1 and internal choices (e.g. Q2 OR Q3).
- [ ] **Validation Logic**:
  - Ensure total marks across sections equal the blueprint's specified `total_marks`.
  - Ensure questions in the bank satisfy the blueprint's module and difficulty requirements.

---

### Phase 4: Paper Generation Engine & Multi-Set (Set A / Set B)
> **Objective**: Generate balanced exam papers automatically or via manual question picking.

- [ ] **Auto-Selection Algorithm (`apps/backend-api/src/papers/generator.service.ts`)**:
  - Pick questions according to blueprint constraints: Topic/Unit coverage, Difficulty ratio (e.g. 40% Easy, 40% Medium, 20% Hard), and Bloom levels.
  - **Set A & Set B Generation**: Generate 2 sets simultaneously, ensuring alternate questions with equivalent difficulty and marks.
- [ ] **Manual Selection Flow**:
  - Connect Zustand store (`useSelectionStore.ts`) to real question IDs.
  - Validate that selected questions meet total marks before allowing "Submit Paper".
- [ ] Save output as `generated_papers` record in Supabase with `status: 'Draft'` or `'Submitted_For_Review'`.

---

### Phase 5: Paper Preview & HOD Moderation Workflow
> **Objective**: Provide an interactive paper review dashboard and approval loop.

- [ ] **Interactive Paper View (`apps/frontend/app/dashboard/papers/[id]/page.tsx`)**:
  - Render the paper exactly as it will look when printed (Header, Instructions, Questions by Section with CO and Marks).
  - Include a **"Swap Question"** button allowing faculty to replace any auto-picked question with an alternate from the bank.
- [ ] **HOD / Exam Cell Moderation Loop**:
  - If user is `HOD` or `Admin`: Show **"Approve Paper"** and **"Reject with Feedback"** actions.
  - If user is `Teacher`: Show status badge (`Pending HOD Approval`, `Approved`, `Draft`).
  - Approved papers are locked from editing.

---

### Phase 6: Document Export Engine (Print-Ready PDF & Editable DOCX)
> **Objective**: Produce official college question papers in PDF and Word formats.

- [ ] **Print-Ready PDF Generation**:
  - Professional college header: College Name, Autonomous Institute affiliation, Course Code, Subject, Date, Time, Max Marks.
  - Strictly formatted question table: Q. No., Question Text with math rendering, Course Outcome (CO), Bloom Level (BL), Marks.
  - Page-break protection (`break-inside: avoid`) to prevent questions from splitting awkwardly across pages.
- [ ] **Word (.docx) Generation**:
  - Export structured paper into standard `.docx` format using `docx` npm package or python service.
  - Allows faculty to make last-minute layout adjustments in MS Word.
- [ ] Store generated files in Supabase Storage (`exam-papers` bucket) and save URLs in `generated_papers`.

---

### Phase 7: Audit Logging & Deployment
> **Objective**: Exam security compliance and deployment for the college.

- [ ] **Audit Trail**: Record every major action in `audit_logs`:
  - `PAPER_CREATED`, `PAPER_MODERATED`, `PAPER_APPROVED`, `PDF_DOWNLOADED`.
- [ ] **Intranet / Server Deployment**:
  - `docker-compose.yml` defining:
    - `frontend` (Next.js container)
    - `backend-api` (NestJS container)
    - `parser-service` (FastAPI container)
    - Optional local Supabase / PostgreSQL for strictly offline intranet deployment.

---

## 🎯 Verification Checklist for College Handover

- [ ] **Security**: A Computer Eng. teacher cannot view Mechanical Eng. questions or papers.
- [ ] **Parsing Accuracy**: Sample unit test papers (PDF/DOCX/CSV) parse into clean questions without losing marks or options.
- [ ] **Accreditation**: Generated papers visibly include Course Outcomes (CO) and Bloom's Taxonomy indicators.
- [ ] **Multi-Set**: Able to generate both **Set A** and **Set B** from the same syllabus with zero overlap.
- [ ] **Print Quality**: PDF prints cleanly on A4 paper with proper college headers and clear font sizing.
- [ ] **Workflow**: Paper passes through Teacher draft $\to$ HOD approval $\to$ Exam Cell locked state.
