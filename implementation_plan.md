# Exam Generator Implementation Plan

This document outlines the architecture and implementation steps for the Scalable Examination Paper Generation System.

## 🏗 Architecture Overview

The system follows a microservices-inspired architecture to handle heavy document parsing and generation tasks asynchronously.

- **Frontend**: Next.js (App Router) - Responsive UI for teachers and admins.
- **Backend API**: NestJS - Core business logic, RBAC, and orchestration.
- **Parser Service**: FastAPI (Python) - High-performance document parsing using libraries like `PyMuPDF` or `python-docx`.
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

## 🗓 Implementation Phases

### Phase 1: Environment & Project Scaffolding
- [x] Initialize directory structure.
- [x] Setup Next.js in `apps/frontend`.
- [x] Setup NestJS in `apps/backend-api`.
- [x] Setup FastAPI in `apps/parser-service`.
- [x] Create `packages/shared-types`.

### Phase 2: Database Schema & Auth (Supabase)
- [x] Design ER diagram / SQL Schema.
- [ ] Create `profiles`, `departments`, `question_banks`, `questions`, `papers` tables.
- [ ] Configure Supabase Auth and RLS policies.

### Phase 3: Parser Service (FastAPI)
- [ ] Implement file upload handling.
- [ ] Implement PDF text extraction.
- [ ] Implement Question/Block detection logic.

### Phase 4: Backend API (NestJS)
- [ ] Integrate Supabase Admin SDK.
- [ ] Implement Question CRUD.
- [ ] Implement Blueprint and Marking Scheme validation.
- [ ] Setup BullMQ for PDF generation tasks.

### Phase 5: Frontend Development
- [ ] shadcn/ui integration.
- [ ] Dashboard layout.
- [ ] Question selection & Blueprint builder.
- [ ] Paper generation UI.

### Phase 6: PDF Generation
- [ ] Create HTML/CSS templates for A4 papers.
- [ ] Implement Puppeteer service in NestJS.

## 🚀 Deployment
- Frontend: Vercel
- Backend: Docker on Fly.io / Render
- DB: Supabase
