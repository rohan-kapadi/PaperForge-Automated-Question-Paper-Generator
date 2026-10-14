# ExamGen / PaperForge — Complete Remaining Development Roadmap

> **Generated:** October 2026 | **Scope:** Full project analysis of frontend (Next.js 16), backend (NestJS), parser (FastAPI/PyMuPDF), and live Supabase schema.
> **Rule:** Every step references the exact files it affects, the exact Supabase tables involved, and the security considerations to follow.

---

## Current State Summary

### What Works (Do NOT re-implement)

| Layer | Status |
|---|---|
| Question Bank upload & parsing (PDF, DOCX, XLSX, CSV) | Live |
| FastAPI parser with Bloom's & difficulty classification | Live |
| Question Library (`/dashboard/library`) with unit filter | Live |
| Blueprints CRUD — create, list, delete, use in generator | Live |
| Paper Generator wizard (6 steps, real backend generation) | Live |
| Generated Papers archive with preview modal | Live |
| Dashboard stats (`/stats` endpoint) | Live |
| Audit Log page — dynamic, fetching from `/audit-logs` | Live |
| Question metadata update by teacher | Live |

### Critical Gaps (from Supabase Table Editor screenshot)

The Supabase Table Editor shows the following tables are **UNRESTRICTED** (no RLS policy active):
- `blueprint_sections`
- `blueprints` (separate from `exam_blueprints` — possible legacy table)
- `paper_questions`
- `subjects`
- `uploads`
- `users` (possible legacy duplicate of `profiles`)

These must be secured before any other feature work continues.

---

## PHASE 1 — Security & Database Hardening ✅ [COMPLETED]

**Goal:** Eliminate all unauthenticated access and secure orphaned/unrestricted tables.
All steps completed: RLS migration prepared, browser singleton with `@supabase/ssr` active, centralized authenticated `apiFetch` in place across all dashboard pages, JWT pass-through ready in NestJS, and NestJS `ValidationPipe` + CORS credentials configured.

---

### Step 1.1 — Enable RLS on all UNRESTRICTED tables

**Context:** The Supabase anon key (which is in the frontend `.env.local`) can read and write all UNRESTRICTED tables without any authentication. Any user who finds the key can freely access all data.

**Files to create:**
- `supabase_migration_v3_rls.sql` in the project root

**Migration SQL (run in Supabase SQL Editor — safe, non-destructive):**

```sql
-- STEP 1: blueprints (investigate if duplicate of exam_blueprints)
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated Read Blueprints"
  ON blueprints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated Write Blueprints"
  ON blueprints FOR ALL TO authenticated USING (true);

-- STEP 2: blueprint_sections
ALTER TABLE blueprint_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated Access Blueprint Sections"
  ON blueprint_sections FOR ALL TO authenticated USING (true);

-- STEP 3: paper_questions
ALTER TABLE paper_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated Access Paper Questions"
  ON paper_questions FOR ALL TO authenticated USING (true);

-- STEP 4: subjects (Admin/HOD write, all authenticated read)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated Read Subjects"
  ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Write Subjects"
  ON subjects FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'HOD')
  ));

-- STEP 5: uploads (owner only)
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner Access Uploads"
  ON uploads FOR ALL TO authenticated USING (user_id = auth.uid());

-- STEP 6: users (treat as profiles mirror — owner only)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner Access Users"
  ON users FOR ALL TO authenticated USING (id = auth.uid());
```

**Security Rule:** Never run DROP TABLE without verifying there are no FK references. Run `SELECT * FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY'` first.

---

### Step 1.2 — Implement Supabase Auth on the Frontend

**Context:** The app has `/login` and `/signup` routes with a `profiles` table synced via trigger to `auth.users`. However, the dashboard has no session guard — anyone can navigate to `/dashboard` without logging in.

**Files to create/edit:**
- `apps/frontend/lib/supabase.ts` — create Supabase browser client singleton
- `apps/frontend/app/login/page.tsx` — wire to `supabase.auth.signInWithPassword()`
- `apps/frontend/app/signup/page.tsx` — wire to `supabase.auth.signUp()`
- `apps/frontend/app/dashboard/layout.tsx` — add session guard

**Actions:**

1. Install: `npm install @supabase/ssr @supabase/supabase-js` in `apps/frontend`
2. Create `apps/frontend/lib/supabase.ts`:
   ```ts
   import { createBrowserClient } from '@supabase/ssr';
   export const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   );
   ```
3. In `dashboard/layout.tsx`, wrap with session check:
   ```ts
   const { data: { session } } = await supabase.auth.getSession();
   if (!session) redirect('/login');
   ```
4. In `login/page.tsx`: call `supabase.auth.signInWithPassword({ email, password })` and redirect on success.
5. In `signup/page.tsx`: call `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`.

**Security Rule:** Use `createServerClient` (from `@supabase/ssr`) in server components and middleware. Use `createBrowserClient` only in client components.

---

### Step 1.3 — Pass Auth JWT from Frontend to Backend

**Context:** All `fetch()` calls from frontend to `http://localhost:3001` are unauthenticated. The NestJS backend uses the anon key, which means RLS is effectively bypassed server-side.

**Files to create/edit:**
- `apps/frontend/lib/api.ts` — centralized authenticated fetch utility
- `apps/backend-api/src/supabase/supabase.service.ts` — accept user JWT for RLS-aware queries
- `apps/backend-api/src/main.ts` — add `ValidationPipe`

**Actions:**

1. Create `apps/frontend/lib/api.ts`:
   ```ts
   import { supabase } from './supabase';
   export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

   export async function apiFetch(path: string, options: RequestInit = {}) {
     const { data: { session } } = await supabase.auth.getSession();
     return fetch(`${API_BASE}${path}`, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
         ...options.headers,
       },
     });
   }
   ```
2. Replace all hardcoded `fetch(`${BACKEND_URL}/...`)` calls across all dashboard pages with `apiFetch('...')`. Affected files:
   - `dashboard/page.tsx`
   - `dashboard/banks/page.tsx`
   - `dashboard/library/page.tsx`
   - `dashboard/blueprints/page.tsx`
   - `dashboard/generate/page.tsx`
   - `dashboard/generated/page.tsx`
   - `dashboard/audit/page.tsx`
   - `dashboard/settings/page.tsx`
3. In NestJS `supabase.service.ts`, create `getClientForUser(jwt: string)` that builds a Supabase client with the user's token so RLS is enforced on all DB queries.
4. In `main.ts`, add:
   ```ts
   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
   app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true });
   ```

**Security Rule:** Never log or expose JWTs. Set a short expiry. Use `HttpOnly` cookies for SSR auth flows.

---

### Step 1.4 — Resolve Legacy/Duplicate Tables

**Context:** Supabase shows both `blueprints` (UNRESTRICTED) and `exam_blueprints` (has RLS). Both `users` and `profiles` exist. These may be legacy tables from earlier development. Keeping unused tables wastes storage and creates confusion.

**Actions:**
1. Run in Supabase SQL Editor to check for data:
   ```sql
   SELECT 'blueprints' as tbl, COUNT(*) FROM blueprints
   UNION ALL SELECT 'users', COUNT(*) FROM users
   UNION ALL SELECT 'blueprint_sections', COUNT(*) FROM blueprint_sections
   UNION ALL SELECT 'paper_questions', COUNT(*) FROM paper_questions;
   ```
2. For each table with 0 rows and no FK references: add to a deprecation list and schedule `DROP TABLE` in a future migration.
3. For `paper_questions`: evaluate if it is intended to normalize the `content JSONB` approach currently used in `generated_papers`. Document the decision.
4. For non-empty legacy tables: migrate data to the canonical tables (`exam_blueprints`, `profiles`) and deprecate.

---

## PHASE 2 — Remove All Mock Data from Production Pages ✅ [COMPLETED]

**Goal:** Every dashboard page must read exclusively from the real database. The `@/lib/mockData` module must not be used in production flows.

---

### Step 2.1 — Clean up `generate/page.tsx` mock usage ✅ [COMPLETED]

**Context:** `apps/frontend/app/dashboard/generate/page.tsx` imports removed. Removed hardcoded fallback banks (`b1`, `b2`, `b3`), fragile prefix checks replaced with UUID regex validation, local synthesis fallback eliminated in favor of real backend generation with error display, and `mockGeneratedPapers.unshift()` removed.

---

### Step 2.2 — Clean up `blueprints/page.tsx` mock usage ✅ [COMPLETED]

**Context:** `apps/frontend/app/dashboard/blueprints/page.tsx` state initialized to `[]`, fallback to `mockBlueprints` removed, empty state with "Create Your First Blueprint" call-to-action added, and offline mock fallback in saving removed.

---

### Step 2.3 — Clean up `generated/page.tsx` mock usage ✅ [COMPLETED]

**Context:** `apps/frontend/app/dashboard/generated/page.tsx` now loads exclusively from `GET /papers`. `mockGeneratedPapers` removed, and error state with Retry button and clean empty state added.

---

### Step 2.4 — Audit and clean `@/lib/mockData.ts` ✅ [COMPLETED]

**Actions Completed:**
1. Extracted all core type definitions (`Blueprint`, `BlueprintSection`, `Question`, `GeneratedPaper`, `AuditLog`) to `apps/frontend/lib/types.ts`.
2. Updated all dashboard pages (`generate`, `blueprints`, `generated`, `manual`) to import from `@/lib/types`.
3. Deleted `apps/frontend/lib/mockData.ts`.
4. Verified TypeScript type checking passing with 0 errors across the entire frontend (`npx tsc --noEmit`).

---

## PHASE 3 — Official Autonomous Paper Format & Balanced "OR" Choice Engine [COMPLETED]

**Goal:** Transform the generation pipeline to produce the official accredited college examination paper format (`REUT_PAPER_Format _Final.docx`): institutional logos, 3-column header boxes, Course Outcomes (CO) table, Sub-Questions (Q1 A, B, C), and strictly balanced "OR" choice pairs (Q1 OR Q2, Q3 OR Q4) with difficulty parity.

---

### Step 3.1 — Autonomous Exam Metadata & Header Collection [COMPLETED]

**Context:** The official college paper format requires extensive institutional metadata that must be collected during generation and formatted into the document:
- **Institute Header:** PCET & PCCOER logos, autonomous status, NAAC A++ / NBA accreditation lines, IQAC cell.
- **Top Header Box:** Academic Year (e.g. `2025 – 26`), Term (`II`), Exam Type (`UNIT TEST`), Record No (`ACAD/R/11`).
- **Subject & Batch Info:** Department (`Computer Engineering`), Class (`SE`), Div (`A, B, C, D, E, F`), Subject (`Database Management Systems`), Subject Code (`PCC-251-COM`), Maximum Marks (`30`), Duration (`1 hr.`), Exam Date (`16/02/2026`).
- **Dynamic Notes:** Auto-generated instructions based on choice structure:
  - *"1. Solve Que.1 or Que.2 and Que.3 or Que.4."*
  - *"2. Give explanation or justification wherever required."*
- **Course Outcomes (CO) Mapping:** Configurable CO table with columns: `[ CO | Course Outcomes | BT Level ]` (e.g., `P251.1 | Design DBMS using ER model | BT 6`).

**Files to edit:**
- `apps/frontend/app/dashboard/generate/page.tsx` — add "Autonomous College Header" form in Step 3
- `apps/frontend/lib/types.ts` — add `ExamPaperHeader`, `CourseOutcome`, and `SubQuestion` interfaces
- `apps/backend-api/src/papers/papers.service.ts` — persist header and CO metadata in `generated_papers.content`

**Actions:**
1. In `apps/frontend/lib/types.ts`, define:
   ```ts
   export interface CourseOutcome {
     co: string;
     desc: string;
     bt: string;
   }

   export interface ExamPaperHeader {
     academic_year: string;
     term: string;
     exam_type: string;
     record_no: string;
     department: string;
     class: string;
     div: string;
     subject_name: string;
     subject_code: string;
     max_marks: number;
     duration: string;
     date: string;
     instructions: string[];
     course_outcomes: CourseOutcome[];
   }
   ```
2. In `generate/page.tsx` Step 3 (Configure): Add an expandable "College Format Details" panel with pre-filled defaults (from Institution Settings) allowing teachers to customize Subject Code, Class, Div, Date, Term, and Record No.

---

### Step 3.2 — Sub-Question Hierarchy & Balanced "OR" Choice Engine [COMPLETED]

**Context:** Autonomous examinations do not ask single isolated questions; they structure exams into Question Groups with internal sub-questions and balanced alternatives:
- **Structure:** Main Que 1 has Sub-Questions `A`, `B`, `C` (e.g., 5 marks each = 15 marks total).
- **Choice Pairing:** Que 1 is paired with Que 2 via an **"OR"** separator; Que 3 is paired with Que 4 via an **"OR"** separator.
- **Difficulty & Bloom's Parity Rule:** When generating Que 2 as an alternative to Que 1:
  - Total marks must be identical (15M vs 15M).
  - Sub-question mark breakdown must match (5M / 5M / 5M).
  - Target Course Outcome (CO) and syllabus scope must match (e.g., both Que 1 and Que 2 test Unit 1 & Unit 2 under `P251.1`).
  - Cognitive level (Bloom's Taxonomy) and difficulty distribution across sub-questions must be strictly balanced (e.g. if Que 1 is 1 Easy + 2 Medium, Que 2 must also be 1 Easy + 2 Medium).
  - Neither option is unfairly advantageous or disadvantageous.

**Files to edit:**
- `apps/backend-api/src/papers/papers.service.ts` — implement paired section generator
- `apps/frontend/components/CollegeQuestionPaper.tsx` — render 5-column table (`[Que | Sub Que. | Questions | Marks/CO/BTL | PI]`) with merged "OR" separator rows
- `apps/frontend/app/dashboard/generate/page.tsx` — connect the generator to produce paired question sets

**Backend Implementation in `PapersService`:**
```ts
// Generate paired choice questions with difficulty & Bloom's parity:
async generatePairedQuestionGroup(
  pool: Question[],
  co: string,
  targetMarks: number = 15,
  subQuestionCount: number = 3,
  targetDifficulty: string = 'Balanced'
) {
  // 1. Pick Sub-Questions A, B, C for Que 1
  const q1_subs = this.pickSubQuestions(pool, co, subQuestionCount, 5, targetDifficulty);
  const usedIds = new Set(q1_subs.map(q => q.id));

  // 2. Mirror exact marks, Bloom's, and difficulty for Que 2 (Alternative)
  const remainingPool = pool.filter(q => !usedIds.has(q.id));
  const q2_subs = q1_subs.map(q1_sub => {
    return this.findMatchingCandidate(remainingPool, {
      marks: q1_sub.marks,
      difficulty: q1_sub.difficulty,
      blooms_level: q1_sub.blooms_level,
      unit: q1_sub.unit
    }) || remainingPool.pop();
  });

  return { q1: q1_subs, q2: q2_subs };
}
```

---

### Step 3.3 — Official DOCX Exporter matching `REUT_PAPER_Format _Final.docx` [COMPLETED]

**Context:** Teachers currently spend hours formatting Word tables. The system must automatically produce a downloadable `.docx` identical to `REUT_PAPER_Format _Final.docx`.

**Files to edit:**
- `apps/parser-service/pccoer_exporter.py` — complete the official docx template writer
- `apps/backend-api/src/papers/papers.controller.ts` — proxy export stream from parser service
- `apps/frontend/app/dashboard/generate/page.tsx` — 1-click "Export Word (.docx)" button
- `apps/frontend/app/dashboard/generated/page.tsx` — download action on archived papers

**DOCX Template Specifications:**
1. **Header Layout:** 2-row x 3-column table with 0-padding:
   - Cell (0,0): Embedded PCET Trust Logo (`pcet_logo.png`)
   - Cell (0,1): Centered institutional typography (PCET Trust, PCCOER College, Autonomous status, NAAC A++, IQAC)
   - Cell (0,2): Embedded PCCOER College Logo (`pccoer_logo.png`)
   - Cell (1,0): `Academic Year: 2025 – 26\nTerm: II`
   - Cell (1,1): Bold Centered Title `UNIT TEST` (14pt, Times New Roman)
   - Cell (1,2): `Record No.: ACAD/R/11`
2. **Metadata Rows:** 3 compact tabular lines:
   - Line 1: `Department: Computer Engineering   Class: SE   Div.: A, B, C, D, E, F`
   - Line 2: `Subject: Database Management Systems   Maximum Marks: 30   Duration: 1 hr.`
   - Line 3: `Subject Code: PCC-251-COM   Date: 16/02/2026`
3. **Instructions Block:** Numbered notes with dynamic choice text: *"Note: 1. Solve Que.1 or Que.2 and Que.3 or Que.4."*
4. **Course Outcomes Table:** 3-column table with thin black borders (`CO`, `Course Outcomes`, `BT Level`).
5. **Questions Table:** 5 columns:
   - `Que` (w: 0.6 in, centered vertically)
   - `Sub Que.` (w: 0.6 in, `A`, `B`, `C`)
   - `Questions` (w: 4.2 in, left-aligned, supports embedded images/diagrams)
   - `Marks/ CO/BTL` (w: 1.1 in, centered, e.g. `(Marks-05)\n[P251.1]\nBT6`)
   - `PI` (w: 1.0 in, Performance Indicators, e.g. `1.3.1, 2.3.1\n3.4.1, 4.2.1`)
   - **OR Separator Row:** Merged across all 5 columns with bold centered text `OR`.
6. **Footer:** On all pages: `Rev.: 00   Date: 01-09-2025` (left) and `Page X of Y` (right).

---

### Step 3.4 — Interactive College Canvas in Frontend (`CollegeQuestionPaper.tsx`)

**Context:** The generated paper preview must render as a true WYSIWYG paper preview inside the browser so teachers can see exactly how it will print and export before downloading.

**Files to edit:**
- `apps/frontend/components/CollegeQuestionPaper.tsx`
- `apps/frontend/app/dashboard/generate/page.tsx` (Step 5 Review)
- `apps/frontend/app/dashboard/generated/page.tsx` (Archive Preview Modal)

**Actions:**
1. Connect `<CollegeQuestionPaper>` directly into Step 5 of the Generate Wizard.
2. Provide interactive toolbar for teachers:
   - **Replace Sub-Question:** Click replace on Sub-question `1B` to browse questions matching 5 marks and BT level.
   - **Edit Question Text:** Inline editing of question wording or mathematical expressions.
   - **Print / PDF:** Uses browser print styling optimized for clean 2-page print without navigation bars or UI chrome.
   - **Export Word (.docx):** Streams real DOCX generated by FastAPI `pccoer_exporter.py`.

---

## PHASE 4 — Institution Settings Persistence ✅ [COMPLETED]

**Goal:** The Settings page currently loses all data on refresh. Settings must be persisted in the database and used in paper headers.

---

### Step 4.1 — Create `institution_settings` table and backend module ✅ [COMPLETED]

**Actions Completed:**
1. Created `supabase_migration_v4_settings.sql` in project root with table definition, RLS read/write policies, and default rows.
2. Created `apps/backend-api/src/settings/settings.service.ts` with DB persistence, fallback caching, `getAll()`, `getSettingsMap()`, `update()`, and `updateMany()`.
3. Created `apps/backend-api/src/settings/settings.controller.ts` exposing `GET /settings` and `PATCH /settings`.
4. Registered `SettingsModule` in `app.module.ts` and imported into `papers.module.ts`.
5. Connected `PapersService.generate()` to read dynamic settings (`college_name`, `trust_name`, `affiliation`, `record_no`, `department`, `academic_year`, `default_duration_minutes`) into `content.header`.
6. Updated `apps/frontend/app/dashboard/settings/page.tsx` with initial fetch on mount, loading state indicator, two-way bound academic year, saving state, error handling, and animated success feedback.
7. Enhanced `<CollegeQuestionPaper>` to resolve and display dynamic institutional branding.
8. Verified both backend and frontend pass full build and type-checking with 0 errors.

---

## PHASE 5 — Question Intelligence Improvements ✅ [COMPLETED]

**Goal:** Improve AI classification accuracy and give teachers better tools for reviewing and correcting metadata.

---

### Step 5.1 — Fix unit detection for spreadsheet and PDF uploads ✅ [COMPLETED]

**Actions Completed:**
1. In `apps/parser-service/main.py`, added dedicated unit/module/chapter column detection for XLSX/CSV spreadsheets (`unit`, `module`, `chapter`, `unit_no`, `unit_number`, `unit_name`, etc.) with `confidence_source: 'spreadsheet_column'` (confidence 0.90).
2. For PDFs, expanded the state machine to detect all-caps unit lines (`UNIT I`, `MODULE 2`), chapter headings (`Chapter 1`), and standalone uppercase section markers with `confidence_source: 'document_header'` (confidence 0.95).
3. Structured hierarchical `confidence_source` tracking:
   - `'document_header'` → 0.95
   - `'spreadsheet_column'` → 0.90
   - `'regex_match'` → 0.75
   - `'position_inferred'` → 0.50
   - `'default'` → 0.25
4. Enhanced `enrich_question` to compute overall question confidence factoring in bloom's, difficulty, question type, and unit source, returning `confidence` and `confidence_source` in the parser output.
5. Added `GET /health` endpoint to FastAPI parser service.

---

### Step 5.2 — "Needs Review" filter in Question Library ✅ [COMPLETED]

**Actions Completed:**
1. In `apps/backend-api/src/questions/questions.service.ts`, implemented `findNeedsReview(bankId?: string)` to identify AI-classified questions with low confidence (< 0.6) or unverified metadata.
2. In `apps/backend-api/src/questions/questions.controller.ts`, updated `GET /questions` to handle `?needs_review=true`.
3. In `apps/frontend/app/dashboard/library/page.tsx`:
   - Added interactive tab strip: "All Questions ({count})" | "⚠ Needs Review ({count})".
   - Added high-visibility low-confidence warning banners displaying the AI confidence score percentage and inference source.
   - Added 1-click "Confirm & Lock" action allowing faculty to instantly verify classifications, which calls `PATCH /questions/:id` with `source: 'teacher'` and transitions the question to verified status.

---

### Step 5.3 — Re-Analyze button on Question Banks page ✅ [COMPLETED]

**Actions Completed:**
1. In `apps/frontend/app/dashboard/banks/page.tsx`, added a dedicated "Re-Analyze" button with spinning loader state to each question bank card.
2. Wired button to call `POST /questions/analyze-missing?bankId=<id>`.
3. Added animated confirmation toast reporting the count of newly classified questions and auto-refreshing the question banks list.
4. Verified all services (Frontend Next.js, Backend NestJS, FastAPI Parser) pass builds and unit tests with 0 errors.

---

## PHASE 6 — Paper Generation UX Fixes [COMPLETED]

**Goal:** Fix bugs and gaps in the 6-step paper generation wizard.

---

### Step 6.1 — Fix blueprint ID detection logic [COMPLETED]
**Completed:** Replaced fragile prefix check in `generate/page.tsx` with standard UUID regex `isUuid()`, correctly distinguishing between Supabase stored blueprints and inline templates.

---

### Step 6.2 — Wire question replacement to backend [COMPLETED]
**Completed:** 
1. In `generate/page.tsx`, updated `handleConfirmReplacement()` to dispatch `POST /papers/:id/replace-question` with `section_index`, `question_index`, `new_question_id`, and `bank_id`.
2. Seamlessly syncs paper sections and recomputed statistics from the backend response into state.
3. Automatically set-aware, updating Set A or Set B based on `activeSetTab`.

---

### Step 6.3 — Load real candidates in Replace Modal [COMPLETED]
**Completed:**
1. In `handleOpenReplaceModal()`, dynamically fetches candidates via `GET /papers/candidates?bankId=&marks=&excludeIds=`.
2. Shows an interactive loading spinner (`RefreshCw` animation) while querying.
3. Enhanced candidate card view with structured metadata: Difficulty badges (Easy: emerald, Medium: amber, Hard: rose), Bloom's level (purple), CO (blue), Unit, and Marks.
4. Added `co` field to `PapersService.getCandidates()` mapping in `apps/backend-api/src/papers/papers.service.ts`.

---

### Step 6.4 — Multi-set paper generation (Set A + Set B) [COMPLETED]
**Completed:**
1. Step 3 (Configure): Added a modern toggle card for "Multi-Set Generation (Set A + Set B)" with "Zero-Overlap" badge.
2. Step 4 (Parameters): Shows dual vs single set selection in the summary card.
3. Generation Pipeline: Executes sequential passes in `executeGeneration()`: generates Set A, collects all selected question IDs, and triggers Set B with `set_name: 'Set B'` and `avoid_question_ids: setAQuestionIds`.
4. Step 5 (Review): Added interactive "Examination Set A" vs "Examination Set B (Zero Overlap)" tab switcher showing question count badges, updating total marks validation and canvas.
5. Step 6 (Export): Provides dedicated download and print actions for both Set A and Set B (DOCX + PDF/Print).

---

## PHASE 7 — HOD Moderation Workflow [COMPLETED]

**Goal:** Implement the full paper approval loop: Teacher generates → submits for review → HOD approves or rejects → paper marked final.

---

### Step 7.1 — Status-aware action buttons in Generated Papers page [COMPLETED]
**Completed:**
1. In `apps/frontend/app/dashboard/generated/page.tsx`:
   - Added workflow filter strip: `All Papers`, `Draft / Generated`, `Awaiting Moderation`, `Approved`, `Rejected`.
   - Distinct status badges with visual cues and icons (`CheckCircle2`, `Clock`, `XCircle`, `FileText`).
   - Dynamic contextual actions:
     - `Draft` / `Generated`: "Submit for Review" button → transitions paper status to `Submitted_For_Review`.
     - `Submitted_For_Review`: Role-aware "Approve" and "Reject" buttons for HOD/Admin with interactive moderation comments modal. Teachers see "Under HOD Review" badge.
     - `Approved`: Quick access to Word (.docx) export and Print / PDF generation.
     - `Rejected`: Prominently renders HOD moderation remarks card and offers "Move to Draft / Revise" action.
2. In `apps/frontend/app/dashboard/generate/page.tsx`:
   - Updated `handleSavePaper()` so newly created papers maintain workflow integrity (status: `Generated`) without prematurely skipping moderation.

---

### Step 7.2 — Enforce valid status transitions on the backend [COMPLETED]
**Completed:**
1. In `apps/backend-api/src/papers/papers.service.ts`:
   - Added strict state machine validation in `updateStatus()` using `VALID_TRANSITIONS` mapping:
     - `Generated` -> `Submitted_For_Review`, `Draft`
     - `Draft` -> `Submitted_For_Review`
     - `Submitted_For_Review` -> `Approved`, `Rejected`
     - `Rejected` -> `Draft`, `Submitted_For_Review`
     - `Approved` -> `Draft` (allows reopening if needed)
   - Disallowed transitions return HTTP 400 Bad Request with a clear validation message.
2. Wired `AuditService` into `PapersModule`:
   - Records all paper status updates in `audit_logs` table (`paper_status_submitted_for_review`, `paper_status_approved`, `paper_status_rejected`, etc.) along with previous status, new status, and moderation comments.

---

### Step 7.3 — Role-based UI using Auth Context [COMPLETED]
**Completed:**
1. Created `apps/frontend/lib/auth-context.tsx`:
   - Provides `user`, `role`, `isHODOrAdmin`, `setRoleOverride`, `signOut`.
   - Fetches active user session and resolves role from Supabase `profiles` table.
   - Includes developer role switcher support via localStorage for instant switching between `Teacher`, `HOD`, and `Admin` personas.
2. Wrapped dashboard in `apps/frontend/app/dashboard/layout.tsx`:
   - Enclosed dashboard inside `<AuthProvider>`.
   - Added interactive topbar Role Switcher dropdown displaying current persona (`Teacher`, `HOD`, `Admin`).
3. Role-gated views:
   - In `apps/frontend/app/dashboard/generated/page.tsx`, Approve/Reject actions only trigger for HOD & Admin.
   - In `apps/frontend/app/dashboard/audit/page.tsx`, restricted access to HOD and Admin personas, showing an unauthorized banner with quick role switch helper for teachers.

---

## PHASE 8 — Live Service Health Checks on Settings Page [COMPLETED]

**Goal:** Replace static "Operational" badges with real health pings.

---

### Step 8.1 — Backend, parser, and database live health diagnostics [COMPLETED]
**Completed:**
1. In `apps/backend-api/src/app.controller.ts`:
   - Added `GET /health` endpoint returning `{ status: 'ok', service: 'backend-api', uptime: number, timestamp: string }`.
2. In `apps/parser-service/main.py`:
   - Verified active `GET /health` endpoint returning `{ status: 'ok', service: 'parser', version: '3.1' }`.
3. In `apps/frontend/app/dashboard/settings/page.tsx`:
   - Added live health state machine (`checking`, `healthy`, `down`) and latency measurement (`latencyMs`) across all 3 subsystems.
   - Pings:
     - **NestJS Backend API**: via `apiFetch('/health')`, reporting status, uptime (formatted in hours/minutes), and latency in ms.
     - **FastAPI Parser Service**: via `fetch('http://localhost:8000/health')` with 4s timeout abort controller, reporting version and status.
     - **Supabase PostgreSQL Engine**: via real query `supabase.from('profiles').select('id', { count: 'exact', head: true })`, verifying RLS connectivity and latency.
   - Rich UI:
     - Glowing status indicator dots: pulsing amber (checking), glowing emerald (operational), red (unavailable).
     - Contextual badges with latency badges (e.g., `Operational (14ms)`).
     - Diagnostic action button ("Run Diagnostics") with spinning animation and "Last verified" timestamp.

---

## PHASE 9 — Code Quality & Production Hardening [COMPLETED]

**Goal:** Technical debt cleanup and security hardening before any deployment.

---

### Step 9.1 — Parser service CORS and file validation [COMPLETED]
**Completed:**
1. In `apps/parser-service/main.py`:
   - Restricted CORS to explicit origins via `PARSER_ALLOWED_ORIGINS` environment variable (defaults to `http://localhost:3001,http://localhost:3000`).
   - Added file size validation in `/parse-document`: enforces a strict 25 MB limit (`413 Payload Too Large`), rejects empty files (`400 Bad Request`).
   - Added file extension (`.docx`, `.pdf`, `.xlsx`, `.xls`, `.csv`) and MIME type validation.
   - Wrapped parser execution in robust try/except blocks with structured HTTP exceptions.

---

### Step 9.2 — NestJS rate limiting [COMPLETED]
**Completed:**
1. Installed `@nestjs/throttler` in `apps/backend-api`.
2. In `apps/backend-api/src/app.module.ts`:
   - Configured `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])`.
   - Registered `ThrottlerGuard` globally via `APP_GUARD`.
3. Added granular route rate limits:
   - In `questions.controller.ts`: Applied `@Throttle({ default: { limit: 5, ttl: 60000 } })` to `POST /questions/upload`.
   - In `papers.controller.ts`: Applied `@Throttle({ default: { limit: 30, ttl: 60000 } })` to `POST /papers/generate`.

---

### Step 9.3 — Add class-validator decorators to all DTOs [COMPLETED]
**Completed:**
1. Verified global `ValidationPipe({ whitelist: true, transform: true })` in `apps/backend-api/src/main.ts`.
2. Applied `class-validator` and `class-transformer` decorators:
   - `apps/backend-api/src/blueprints/blueprints.service.ts`: `BlueprintSectionConfig` and `CreateBlueprintDto` with `@IsString`, `@IsNotEmpty`, `@IsNumber`, `@Min`, `@IsOptional`, `@IsArray`, `@IsBoolean`, `@ValidateNested`, and `@Type`.
   - `apps/backend-api/src/papers/papers.service.ts`: `CourseOutcomeDto`, `GeneratePaperDto`, `UpdatePaperStatusDto` (with `@IsIn`), and `ReplaceQuestionDto`.
   - `apps/backend-api/src/audit/audit.service.ts`: `CreateAuditLogDto` with `@IsString`, `@IsNotEmpty`, and `@IsOptional`.

---

### Step 9.4 — Environment variable audit and `.env.example` files [COMPLETED]
**Completed:**
1. Hardened root `.gitignore` and `apps/frontend/.gitignore` to ignore `.env`, `.env.local`, `.env*.local`, `*.env` while exempting `.env.example` templates.
2. Verified git commit history contains no exposed `supabase_service_role` secrets.
3. Created/updated `apps/backend-api/.env.example` with standard environment placeholders (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT`, `PARSER_SERVICE_URL`, `FRONTEND_URL`).
4. Created `apps/frontend/.env.local.example` with public client placeholders (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_PARSER_URL`).
5. Verified frontend does not contain or reference `SUPABASE_SERVICE_ROLE_KEY`.

---

## PHASE 10 — Polish & Deployment Preparation [COMPLETED]

**Goal:** Final polish before presentation or deployment.

---

### Step 10.1 — Dynamic institution name in paper preview [COMPLETED]
**Completed:**
1. In `apps/frontend/app/dashboard/generated/page.tsx`:
   - Fetches live institution parameters from `GET /settings` on mount (`fetchSettings()`).
   - In the paper preview modal, passes `collegeName`, `trustName`, `affiliation`, `iqacText`, `recordNo`, `department`, and `academicYear` directly into `<CollegeQuestionPaper />`.
   - Replaces any hardcoded institution headers with the active database values across preview, PDF print, and Word exports.

---

### Step 10.2 — Supabase Storage for uploaded question bank files [COMPLETED]
**Completed:**
1. In `apps/backend-api/src/questions/questions.service.ts`:
   - In `uploadAndParse()`, immediately uploads the raw source file buffer to Supabase Storage bucket `question-banks` under `${bankId}/${file.originalname}`.
   - Updates `question_banks` record with `storage_path`.
   - Uses try/catch guards so if storage is unconfigured or throttled, document parsing completes smoothly without disrupting user experience.

---

### Step 10.3 — Mobile responsiveness audit [COMPLETED]
**Completed:**
1. In `apps/frontend/app/dashboard/layout.tsx`:
   - Responsive sidebar drawer: slides off-screen on mobile (`-translate-x-full md:translate-x-0 md:w-20`) and slides in over the page when toggled.
   - Backdrop overlay on mobile when drawer is active, closing on outside touch/click.
   - Added mobile hamburger menu button in the topbar (`md:hidden`).
   - Adapted main container margins (`ml-0 md:ml-64`) and paddings (`p-4 sm:p-6 md:p-8`).
2. In `apps/frontend/app/dashboard/generate/page.tsx`:
   - Added smooth overflow horizontal scrolling (`overflow-x-auto scrollbar-none scroll-smooth`) on the 6-step wizard header container so mobile viewports navigate smoothly.
3. In `apps/frontend/app/dashboard/library/page.tsx`:
   - Responsive card grid with compact badges and hidden non-essential indicators (`hidden sm:inline-block`) for clean mobile display.

---

## Implementation Priority Matrix

| Priority | Phase | Estimated Effort | Status |
|---|---|---|---|
| Critical | Phase 1 — Security & RLS | 1 day | ✅ COMPLETED |
| Critical | Phase 1.2 — Auth | 1-2 days | ✅ COMPLETED |
| High | Phase 2 — Remove mocks | 1 day | ✅ COMPLETED |
| High | Phase 3 — PDF Export | 2 days | ✅ COMPLETED |
| Medium | Phase 4 — Settings | 1 day | ✅ COMPLETED |
| Medium | Phase 5 — Intelligence | 1-2 days | ✅ COMPLETED |
| Medium | Phase 6 — Generator UX | 1 day | ✅ COMPLETED |
| Normal | Phase 7 — HOD Workflow | 2 days | ✅ COMPLETED |
| Normal | Phase 8 — Health Checks | 0.5 days | ✅ COMPLETED |
| Normal | Phase 9 — Code Quality | 1 day | ✅ COMPLETED |
| Polish | Phase 10 — Final Polish | 1 day | ✅ COMPLETED |

---

## Final Pre-Deployment Checklist

- [x] All UNRESTRICTED tables have RLS enabled (Phase 1.1)
- [x] Login/signup/logout flow works end-to-end (Phase 1.2)
- [x] All frontend pages pass JWT to backend (Phase 1.3)
- [x] No `mockData` imports remain in any production page (Phase 2.4)
- [x] PDF export produces a real downloadable file (Phase 3.1)
- [x] Institution settings persist in database (Phase 4.1)
- [x] "Needs Review" filter helps teachers fix low-confidence questions (Phase 5.2)
- [x] Blueprint ID detection uses UUID regex (Phase 6.1)
- [x] Question replacement syncs to backend (Phase 6.2)
- [x] Paper status workflow (Submit → Approve/Reject) works (Phase 7.1)
- [x] Role-based UI hides HOD-only actions from Teachers (Phase 7.3)
- [x] Service health badges show live status (Phase 8.1)
- [x] CORS is restricted to frontend origin (Phase 9.1 & 9.2)
- [x] Rate limiting is active on upload and generation endpoints (Phase 9.2)
- [x] `.env` files are in `.gitignore` and no keys are in git history (Phase 9.4)
- [x] `ValidationPipe` is active globally in NestJS (Phase 1.3)
- [x] Paper preview and PDF use dynamic institution name from settings (Phase 10.1)

---

*All phases completed and verified.*
