# Exam Generator - Product Engineering Summary

## 🎯 MVP Scope

| Must-Have (Core Engine) | Nice-to-Have (Phase 2) |
| :--- | :--- |
| **PDF Parsing**: High-accuracy text extraction & block detection. | **Automated Selection**: AI-driven "randomize from blueprint." |
| **Question Workbench**: Card-based UI to edit/approve parsed questions. | **Collaborative Workflow**: HOD approval/rejection loops. |
| **Rule Engine**: Validation for total marks/section constraints. | **Advanced Templates**: LaTeX support for complex math/diagrams. |
| **A4 PDF Engine**: Pixel-perfect generation via Puppeteer. | **Analytics**: Difficulty trending across departments. |
| **RBAC**: Department-level isolation via Supabase RLS. | **Audit Logs**: Detailed activity tracking in n8n. |

---

## 🏗️ Technical Architecture Plan

### 📊 System Diagram
```text
[Frontend: Next.js] <--> [Backend API: NestJS] <--> [Supabase: DB/Auth]
                               |
                               +--> [Parser: FastAPI]
                               |
                               +--> [Worker: BullMQ + Puppeteer]
```

---

## 🔌 API Contract (REST v1)

### 🧩 Error Response Object
```json
{
  "status": "error",
  "code": "INVALID_INPUT",
  "message": "Validation failed",
  "errors": [{ "field": "marks", "message": "Must be positive" }]
}
```

### 🛰️ Endpoints

#### **Question Banks**
- `GET /banks`: List banks. 
  - *Query*: `page`, `limit`, `name_filter`.
- `POST /banks`: Create bank. 
  - *Body*: `{ name: string, department_id: uuid }`.
- `GET /banks/{id}/questions`: List questions in bank.
  - *Query*: `difficulty`, `topic`.

#### **Question Ingestion**
- `POST /ingest/parse`: Upload doc for parsing.
  - *Type*: `multipart/form-data` (PDF/DOCX).
  - *Response*: `200 OK` with suggested blocks JSON.
- `POST /ingest/commit`: Save approved questions to bank.
  - *Body*: `{ bank_id: uuid, questions: Question[] }`.

#### **Blueprints**
- `POST /blueprints`: Define scheme.
  - *Rule*: Validate `totalMarks` against `sections[].marks`.
- `GET /blueprints`: List templates.

#### **Paper Generation**
- `POST /papers/generate`: Start PDF build.
  - *Body*: `{ blueprint_id: uuid, selected_question_ids: uuid[] }`.
  - *Response*: `201 Created` with `{ job_id: string }`.
- `GET /papers/status/{job_id}`: Poll status.
  - *States*: `Pending`, `Processing`, `Completed`, `Failed`.
  - *Result*: Includes `pdf_url` on completion.

### 🛡️ Validation Rules
- **Marks**: Integer, range 1-100.
- **Difficulty**: Enum `[Easy, Medium, Hard]`.
- **Blueprints**: Schema validation using `class-validator` (NestJS).

---

## 🌐 Frontend (Next.js + Tailwind + shadcn/ui)
- **Pages**:
  - `/auth/login`: Email/Password sign-in.
  - `/dashboard`: Overview of question banks and recent papers.
  - `/banks/[id]`: Question workbench.
  - `/papers/new`: Wizard for paper generation.

## 🗄️ Database Schema (PostgreSQL)

### 📋 Table Definitions
- **`departments`**:
  - `id`: `uuid` (PK)
  - `name`: `text` (Unique, e.g., "Computer Science")
  - `code`: `text` (Unique, e.g., "CS-101")
- **`profiles`**:
  - `id`: `uuid` (PK, references `auth.users`)
  - `email`: `text` (Unique)
  - `role`: `enum` (`Admin`, `HOD`, `Teacher`)
  - `department_id`: `uuid` (FK -> `departments.id`)
- **`question_banks`**:
  - `id`: `uuid` (PK)
  - `name`: `text`
  - `department_id`: `uuid` (FK -> `departments.id`, **ON DELETE CASCADE**)
  - `created_by`: `uuid` (FK -> `profiles.id`)
- **`questions`**:
  - `id`: `uuid` (PK)
  - `bank_id`: `uuid` (FK -> `question_banks.id`, **ON DELETE CASCADE**)
  - `text`: `text` (Markdown support)
  - `marks`: `integer` (Constraint: > 0)
  - `difficulty`: `enum` (`Easy`, `Medium`, `Hard`)
  - `topic`: `text`
  - `metadata`: `jsonb` (Images, options for MCQs)
- **`exam_blueprints`**:
  - `id`: `uuid` (PK)
  - `title`: `text`
  - `department_id`: `uuid` (FK -> `departments.id`)
  - `schema`: `jsonb` (Section configuration, total marks, time limit)
- **`generated_papers`**:
  - `id`: `uuid` (PK)
  - `blueprint_id`: `uuid` (FK -> `exam_blueprints.id`)
  - `status`: `enum` (`Pending`, `Processing`, `Completed`, `Failed`)
  - `content`: `jsonb` (Snapshot of selected question IDs and their text)
  - `pdf_url`: `text` (Supabase Storage link)

### ⚡ Indexes that Matter
- `idx_questions_bank_difficulty`: `(bank_id, difficulty)` - Optimizes question selection engine.
- `idx_profiles_dept`: `(department_id)` - Ensures fast Row Level Security (RLS) evaluation.
- `idx_papers_status`: `(status, created_at)` - Powers the dashboard "Recent Activity" feed.

### 🌱 Seed Data Plan
1. **System Admin**: Create a superuser profile for initial configuration.
2. **Standard Departments**: Seed "CS", "IT", "EEE" with standard codes.
3. **Template Blueprints**: 1x "Mid-Term (30m)", 1x "Final Exam (100m)".
4. **Mock Bank**: 1x "Data Structures" bank with 20 varied questions for UI testing.

---

## 🚀 Local Setup Checklist

### 🛠 Prerequisites
- **Node.js**: v20+ (with npm)
- **Python**: v3.10+ (for Parser service)
- **Docker Desktop**: Required for local Redis and optional local Supabase.
- **Supabase CLI**: (Optional) For managing local migrations.

### 🔐 Environment Variables (.env)
- **Frontend (`apps/frontend/.env.local`)**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL=http://localhost:3001`
- **Backend (`apps/backend-api/.env`)**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REDIS_HOST=localhost`, `REDIS_PORT=6379`
  - `PARSER_SERVICE_URL=http://localhost:8000`

### 🏃 Running the Services

1. **Database & Redis**:
   - Start Redis: `docker run -d -p 6379:6379 redis:alpine`
   - Apply `supabase_schema.sql` to your Supabase instance.

2. **Parser Service (Python)**:
   ```bash
   cd apps/parser-service
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   python main.py
   ```

3. **Backend API (NestJS)**:
   ```bash
   cd apps/backend-api
   npm install
   npm run start:dev
   ```

4. **Frontend (Next.js)**:
   ```bash
   cd apps/frontend
   npm install
   npm run dev
   ```

### 🩹 Common Fixes
- **Port Conflicts**: If port 3000 is busy, use `npx kill-port 3000`.
- **CORS Issues**: Add `localhost:3000` to the allowed origins in `main.py` (Parser) and `main.ts` (NestJS).
- **Environment Not Loading**: Ensure `.env` files are in the root of their respective `apps/` folders.
- **Redis Error**: Ensure Docker Desktop is running before starting the NestJS backend.
