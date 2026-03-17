# Exam Generator Implementation Plan

This document outlines the architecture, current progress, and remaining implementation steps for the Scalable Examination Paper Generation System.

## 🏗 Architecture Overview

The system follows a microservices-inspired architecture to handle heavy document parsing and generation tasks asynchronously.

- **Frontend**: Next.js (App Router) - Responsive UI for teachers and admins.
- **Backend API**: NestJS - Core business logic, RBAC, and orchestration.
- **Parser Service**: FastAPI (Python) - High-performance document parsing using `PyMuPDF` and `python-docx`.
- **Database**: Supabase (PostgreSQL) - Relational data with built-in Auth and RLS.
- **Queue**: BullMQ + Redis - For PDF generation and async jobs.
- **Automation**: n8n - Workflow orchestration.

## 📂 Project Structure

```text
/
├── apps/
│   ├── frontend/             # Next.js web application
│   ├── backend-api/          # NestJS core API
│   └── parser-service/       # FastAPI document parsing service
├── packages/
│   └── shared-types/         # Common TypeScript interfaces
├── docker-compose.yml        # Local development environment
└── README.md
```

## 📊 Current Progress Estimate

| Component          | Completion |
|--------------------|------------|
| Frontend UI        | ~85%       |
| Backend APIs       | ~15%       |
| Parser Service     | ~40%       |
| Database           | ~90%       |
| System Integration | ~10%       |

---

## ✅ What is Already Done

### 1. Frontend UI Layer (~85%)
- [x] Landing page
- [x] Login page
- [x] Signup page
- [x] Dashboard layout (sidebar + topbar)
- [x] Dashboard — Overview section
- [x] Dashboard — Upload UI
- [x] Dashboard — Question Library
- [x] Dashboard — Manual Selection
- [x] Dashboard — Blueprint Builder
- [x] Dashboard — Auto Generate (mock preview)
- [x] Dashboard — Generated Papers list
- [x] Dashboard — Audit Logs UI
- [x] Zustand store for selected questions
- [x] Mock data models
- [x] Tailwind + UI styling complete
- [x] Supabase client configured (not yet used)

> **Status**: UI complete but uses mock data.

### 2. Backend API — NestJS (~15%)
- [x] Server running
- [x] Supabase connection module
- [x] Basic root endpoint
- [x] Questions API — `GET /questions`
- [x] Questions API — `POST /questions`

> **Status**: Minimal backend, questions module only.

### 3. Parser Service — FastAPI (~40%)
- [x] File upload endpoint (`/parse-document`)
- [x] PDF parsing using PyMuPDF
- [x] Extracts questions using regex
- [x] CORS middleware configured
- [x] Virtual environment + dependencies installed

> **Status**: Works for PDFs only. Regex-based extraction is basic.

### 4. Database — Supabase (~90%)
- [x] Full SQL schema created
- [x] Tables: `profiles`, `departments`, `question_banks`, `questions`, `exam_blueprints`, `generated_papers`
- [x] Enums: `user_role`, `question_difficulty`
- [x] Row Level Security (RLS) policies written

> **Status**: Schema ready but not fully applied nor integrated.

### 5. Shared Types
- [x] TypeScript interface: `Question`
- [x] TypeScript interface: `ExamBlueprint`
- [x] TypeScript interface: `UserRole`

> **Status**: Exists but not yet used across services.

---

## 🗓 Remaining Work (Correct Priority Order)

### Phase 1: Backend Core Modules
- [ ] Create `blueprints` module (CRUD)
- [ ] Create `papers` module (CRUD)
- [ ] Create `audit` module
- [ ] Create `upload` module (proxy to parser-service)

> **Reason**: Frontend and parser will depend on these APIs.

### Phase 2: Paper Generation Engine (Core Logic)
- [ ] Implement `PaperService`
  - [ ] Validate blueprint schema
  - [ ] Check marks totals
  - [ ] Organize questions into sections
  - [ ] Generate structured paper JSON `{ sections: [...], totalMarks: N }`

> **Reason**: PDF generation depends on this structured output.

### Phase 3: Upload → Parser → Database Pipeline
- [ ] Frontend Upload → Backend upload endpoint
- [ ] Backend proxies file to `parser-service`
- [ ] Parser extracts questions and returns JSON
- [ ] Backend stores extracted questions in Supabase

> **Reason**: Question library must be populated with real data.

### Phase 4: Frontend → Backend Integration
- [ ] Replace mock data with real API calls (TanStack Query)
- [ ] Question Library page
- [ ] Manual Selection page
- [ ] Blueprint Builder page
- [ ] Generated Papers page
- [ ] Audit Logs page

### Phase 5: Authentication
- [ ] Supabase Signup / Login flow
- [ ] JWT returned from Supabase Auth
- [ ] Frontend sends JWT in `Authorization` header
- [ ] NestJS backend verifies JWT

> **Reason**: Security must be in place before exposing real APIs.

### Phase 6: Role-Based Access Control (RBAC)
- [ ] Define roles: `admin`, `hod`, `faculty`
- [ ] Implement NestJS Guards per role
- [ ] Apply Supabase RLS per role

### Phase 7: PDF Generation
- [ ] Create HTML/CSS A4 paper templates
- [ ] Implement Puppeteer service in NestJS
- [ ] Pipeline: Paper JSON → HTML → Puppeteer → A4 PDF → Supabase Storage

> **Reason**: PDF is the final output; must come after the paper engine is stable.

### Phase 8: Paper Preview
- [ ] Render structured paper JSON in the frontend before PDF generation

> **Reason**: Better UX and debugging before committing to PDF.

### Phase 9: DOCX Parsing
- [ ] Uncomment and implement `python-docx` parsing in parser-service
- [ ] Support `.docx` file uploads end-to-end

### Phase 10: Audit Logging
- [ ] Track: paper generated, upload events, user login actions
- [ ] Connect event logs to the frontend Audit Logs page

### Phase 11: Automation (n8n)
- [ ] Workflow: Upload → Parser → Database
- [ ] Workflow: Paper generated → Notify HOD

---

## 🚀 Final Correct Flow

```
Backend modules
    ↓
Paper generation engine
    ↓
Upload → Parser pipeline
    ↓
Frontend API integration
    ↓
Authentication
    ↓
Role-based access
    ↓
PDF generation
    ↓
Paper preview
    ↓
DOCX parsing
    ↓
Audit logging
    ↓
Automation (n8n)
```

## 🚀 Deployment

- **Frontend**: Vercel
- **Backend**: Docker on Fly.io / Render
- **Database**: Supabase Cloud
