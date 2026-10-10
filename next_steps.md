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

## PHASE 1 — Security & Database Hardening

**Goal:** Eliminate all unauthenticated access and secure orphaned/unrestricted tables.
This must be done first — all other phases build on top of a secured foundation.

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

## PHASE 4 — Institution Settings Persistence

**Goal:** The Settings page currently loses all data on refresh. Settings must be persisted in the database and used in paper headers.

---

### Step 4.1 — Create `institution_settings` table and backend module

**Files to create:**
- `supabase_migration_v4_settings.sql`
- `apps/backend-api/src/settings/settings.module.ts`
- `apps/backend-api/src/settings/settings.controller.ts`
- `apps/backend-api/src/settings/settings.service.ts`

**Migration SQL:**
```sql
CREATE TABLE IF NOT EXISTS institution_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE institution_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated Read Settings"
  ON institution_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin Write Settings"
  ON institution_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'HOD')));

INSERT INTO institution_settings (key, value) VALUES
  ('college_name', 'Department of Computer Engineering'),
  ('affiliation', 'An Autonomous Institute Affiliated to State University'),
  ('default_duration_minutes', '90'),
  ('academic_year', '2025-2026')
ON CONFLICT (key) DO NOTHING;
```

**Backend Actions:**
1. Create `SettingsService` with `getAll()` returning `{ key: string, value: string }[]` and `update(key: string, value: string)`.
2. Create `SettingsController` exposing `GET /settings` and `PATCH /settings`.
3. Register the module in `app.module.ts`.

**Frontend Actions:**
1. In `settings/page.tsx`, use `useEffect` to fetch current settings on mount.
2. `handleSave()` calls `PATCH /settings` with changed key-value pairs.
3. Show a real success/error toast.

**Integration:** In `papers.service.ts`, `generate()` should read `college_name` and `affiliation` from settings when building the `content.header` object so the paper header is dynamic.

---

## PHASE 5 — Question Intelligence Improvements

**Goal:** Improve AI classification accuracy and give teachers better tools for reviewing and correcting metadata.

---

### Step 5.1 — Fix unit detection for spreadsheet and PDF uploads

**Context:** The FastAPI parser's `UNIT_HEADER_REGEX` works well for DOCX files but not for PDFs (no heading semantics) or spreadsheets (unit may be in a column, not a header row).

**Files to edit:**
- `apps/parser-service/main.py`

**Actions:**
1. For XLSX/CSV: if a column named `unit`, `chapter`, or `module` exists, map it directly — skip regex.
2. For PDFs: expand the state machine to detect all-caps lines, bold-like patterns (text followed by a blank line), and numbered chapter headings.
3. Add a `confidence_source` field per question:
   - `'document_header'` → confidence: 0.95
   - `'regex_match'` → confidence: 0.75
   - `'spreadsheet_column'` → confidence: 0.90
   - `'position_inferred'` → confidence: 0.50
   - `'default'` → confidence: 0.25
4. Return `confidence` in the parser API response alongside each question.

---

### Step 5.2 — "Needs Review" filter in Question Library

**Context:** Teachers should be able to quickly see which questions were classified with low confidence and correct them inline.

**Files to edit:**
- `apps/backend-api/src/questions/questions.controller.ts` — add `?needs_review=true` query param
- `apps/backend-api/src/questions/questions.service.ts` — add `findNeedsReview()` method
- `apps/frontend/app/dashboard/library/page.tsx` — add "Needs Review" filter tab

**Backend Actions:**
1. In `QuestionsService`, add:
   ```ts
   async findNeedsReview(bankId?: string) {
     let q = this.supabaseService.getClient().from('questions')
       .select('*')
       .eq('classification_source', 'ai')
       .lt('metadata->>confidence', 0.6);
     if (bankId) q = q.eq('bank_id', bankId);
     const { data, error } = await q.order('created_at', { ascending: false });
     if (error) throw new HttpException(error.message, HttpStatus.BAD_GATEWAY);
     return data ?? [];
   }
   ```
2. In the controller, handle `?needs_review=true` query param.

**Frontend Actions:**
1. Add a tab strip to the library page: "All Questions" | "⚠ Needs Review (N)".
2. The "Needs Review" tab fetches with `?needs_review=true` and shows questions with an inline edit form for difficulty, blooms_level, unit, and topic.
3. On save, call `PATCH /questions/:id` with `source: 'teacher'` to lock the classification.

---

### Step 5.3 — Re-Analyze button on Question Banks page

**Context:** `POST /questions/analyze-missing` exists in the backend but has no UI trigger.

**Files to edit:**
- `apps/frontend/app/dashboard/banks/page.tsx`

**Actions:**
1. Add a "Re-Analyze" button to each bank card.
2. On click: call `POST /questions/analyze-missing?bankId=<id>`.
3. Show a progress toast while processing.
4. On completion: refresh the bank list and show "X questions re-classified".

---

## PHASE 6 — Paper Generation UX Fixes

**Goal:** Fix bugs and gaps in the 6-step paper generation wizard.

---

### Step 6.1 — Fix blueprint ID detection logic

**Context:** Line 355 of `generate/page.tsx` uses `!selectedBlueprint.id.startsWith('bp-') && !selectedBlueprint.id.startsWith('bp_')` to detect real UUIDs. This is fragile.

**Files to edit:**
- `apps/frontend/app/dashboard/generate/page.tsx`

**Actions:**
Replace the prefix check with:
```ts
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isRealBlueprint = UUID_REGEX.test(selectedBlueprint.id);
if (isRealBlueprint) {
  payload.blueprint_id = selectedBlueprint.id;
} else {
  payload.blueprint = { /* inline object */ };
}
```

---

### Step 6.2 — Wire question replacement to backend

**Context:** `handleConfirmReplacement()` only updates local React state. The backend `POST /papers/:id/replace-question` endpoint exists but is never called, so replacements are lost on page refresh.

**Files to edit:**
- `apps/frontend/app/dashboard/generate/page.tsx`

**Actions:**
After updating local state, call:
```ts
if (generatedPaperId) {
  await apiFetch(`/papers/${generatedPaperId}/replace-question`, {
    method: 'POST',
    body: JSON.stringify({
      section_index: replaceModal.sectionIndex,
      question_index: replaceModal.questionIndex,
      new_question_id: replacement.id,
      bank_id: selectedBank?.id,
    }),
  });
}
```
Sync `paperSections` from the backend response on success.

---

### Step 6.3 — Load real candidates in Replace Modal

**Context:** The replace modal currently uses `allAvailableQuestions` (all questions from the bank, loaded at mount). It should load targeted candidates filtered by marks.

**Files to edit:**
- `apps/frontend/app/dashboard/generate/page.tsx`

**Actions:**
1. When `handleOpenReplaceModal()` is called, fetch:
   ```ts
   const res = await apiFetch(`/papers/candidates?bankId=${selectedBank?.id}&marks=${currentMark}`);
   const data = await res.json();
   setCandidateQuestions(data);
   ```
2. Show a loading spinner in the modal while fetching.
3. Display real candidates with difficulty, blooms level, unit, and CO metadata.

---

### Step 6.4 — Multi-set paper generation (Set A + Set B)

**Context:** The `generated_papers` table has a `set_name` column. Many institutions require Set A and Set B with no overlapping questions.

**Files to edit:**
- `apps/frontend/app/dashboard/generate/page.tsx` — add Set B toggle in Step 3
- `apps/backend-api/src/papers/papers.service.ts` — second-pass generation

**Actions:**
1. Add a toggle in Step 3 (Configure): "Generate Set A only" / "Generate Set A + Set B".
2. If Set B is selected, after generating Set A, call `/papers/generate` again with `avoid_question_ids` set to all question IDs from Set A.
3. Show both sets in Step 5 with a "Set A | Set B" tab switcher.
4. Save both to `generated_papers` with respective `set_name` values.

---

## PHASE 7 — HOD Moderation Workflow

**Goal:** Implement the full paper approval loop: Teacher generates → submits for review → HOD approves or rejects → paper marked final.

---

### Step 7.1 — Status-aware action buttons in Generated Papers page

**Context:** `generated_papers` has `paper_status` enum: `Draft`, `Submitted_For_Review`, `Approved`, `Rejected`, `Generated`. The existing `PATCH /papers/:id/status` endpoint can update these. The UI currently has no status-based actions.

**Files to edit:**
- `apps/frontend/app/dashboard/generated/page.tsx`

**Actions:**
1. Show action buttons based on current `status`:
   - `Generated` or `Draft` → "Submit for Review" button → sets status to `Submitted_For_Review`
   - `Submitted_For_Review` → (HOD/Admin only) "Approve" and "Reject" buttons with optional comment input
   - `Approved` → "Export PDF" and "Download DOCX" buttons
   - `Rejected` → show `moderation_comments` and "Re-Generate" button (links to `/dashboard/generate` with paper context)
2. Each action calls `PATCH /papers/:id/status` via `apiFetch`.
3. After status change, record to `audit_logs` (already done in backend — verify).

---

### Step 7.2 — Enforce valid status transitions on the backend

**Files to edit:**
- `apps/backend-api/src/papers/papers.service.ts`

**Actions:**
In `updateStatus()`, add a state machine check:
```ts
const VALID_TRANSITIONS: Record<string, string[]> = {
  'Generated': ['Submitted_For_Review'],
  'Draft': ['Submitted_For_Review'],
  'Submitted_For_Review': ['Approved', 'Rejected'],
  'Rejected': ['Draft'],
  'Approved': [], // terminal
};
const allowed = VALID_TRANSITIONS[currentStatus] || [];
if (!allowed.includes(dto.status)) {
  throw new HttpException(`Cannot transition from ${currentStatus} to ${dto.status}`, HttpStatus.BAD_REQUEST);
}
```

---

### Step 7.3 — Role-based UI using Auth Context

**Files to create/edit:**
- `apps/frontend/lib/auth-context.tsx` — React context that exposes `{ user, role, session }`
- `apps/frontend/app/dashboard/layout.tsx` — wrap children with `<AuthProvider>`
- All dashboard pages that need role checks

**Actions:**
1. Create `AuthContext` that loads `session` from Supabase and fetches the user's `role` from `profiles`.
2. Wrap the dashboard layout with `<AuthProvider>`.
3. In `generated/page.tsx`, show Approve/Reject buttons only when `role === 'HOD' || role === 'Admin'`.
4. In `audit/page.tsx`, only HODs and Admins should see the full log.

---

## PHASE 8 — Live Service Health Checks on Settings Page

**Goal:** Replace static "Operational" badges with real health pings.

---

### Step 8.1 — Backend and parser health endpoints

**Files to edit:**
- `apps/backend-api/src/app.controller.ts` — confirm `GET /health` returns `{ status: 'ok', uptime: number }`
- `apps/parser-service/main.py` — add `GET /health` if missing
- `apps/frontend/app/dashboard/settings/page.tsx` — live ping on mount

**Actions:**
1. In `settings/page.tsx`, add health check state:
   ```ts
   const [backendHealth, setBackendHealth] = useState<'checking' | 'up' | 'down'>('checking');
   const [parserHealth, setParserHealth] = useState<'checking' | 'up' | 'down'>('checking');
   ```
2. On mount, ping:
   - `GET /health` → backend status
   - `GET http://localhost:8000/health` → parser status
   - Supabase: `supabase.from('profiles').select('count')` → DB status
3. Show animated green/red/yellow dot badges based on actual response.

---

## PHASE 9 — Code Quality & Production Hardening

**Goal:** Technical debt cleanup and security hardening before any deployment.

---

### Step 9.1 — Parser service CORS and file validation

**Context:** `main.py` sets `allow_origins=["*"]` — any origin can call the parser. The parser should only accept calls from the NestJS backend.

**Files to edit:**
- `apps/parser-service/main.py`

**Actions:**
1. Restrict CORS to `http://localhost:3001` (and production backend URL via env var).
2. Add file size limit: reject files > 25 MB.
3. Add MIME type validation before processing.
4. Wrap all parse functions in `try/except` with structured error responses.

---

### Step 9.2 — NestJS rate limiting

**Actions:**
1. Install: `npm install @nestjs/throttler` in `apps/backend-api`.
2. Configure:
   ```ts
   ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }])
   ```
3. Apply `@Throttle({ default: { limit: 5, ttl: 60000 } })` specifically to `/questions/upload` (prevent abuse).
4. Apply `@Throttle({ default: { limit: 30, ttl: 60000 } })` to `/papers/generate`.

---

### Step 9.3 — Add class-validator decorators to all DTOs

**Files to edit:**
- `apps/backend-api/src/blueprints/blueprints.service.ts` — `CreateBlueprintDto`
- `apps/backend-api/src/papers/papers.service.ts` — `GeneratePaperDto`, `UpdatePaperStatusDto`
- `apps/backend-api/src/audit/audit.service.ts` — `CreateAuditLogDto`

**Actions:**
Install: `npm install class-validator class-transformer`

Add decorators:
```ts
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray } from 'class-validator';

export class CreateBlueprintDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsNumber() @Min(10)
  total_marks: number;

  @IsNumber() @Min(30)
  duration_minutes: number;

  @IsArray() @IsNotEmpty()
  sections: BlueprintSectionConfig[];
}
```

---

### Step 9.4 — Environment variable audit and `.env.example` files

**Context:** The `.env` and `.env.local` files contain live Supabase keys. If ever committed to git (even accidentally), the keys need to be rotated immediately.

**Actions:**
1. Verify `.gitignore` contains:
   ```
   .env
   .env.local
   .env*.local
   *.env
   ```
2. Check git history: `git log --all -p | grep -i "supabase_service_role"` — if found, rotate the key immediately in the Supabase dashboard.
3. Create `apps/backend-api/.env.example` with placeholder values:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PORT=3001
   PARSER_SERVICE_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:3000
   ```
4. Create `apps/frontend/.env.local.example` similarly.
5. Never use `SUPABASE_SERVICE_ROLE_KEY` in the frontend. It must only be in the backend `.env`.

---

## PHASE 10 — Polish & Deployment Preparation

**Goal:** Final polish before presentation or deployment.

---

### Step 10.1 — Dynamic institution name in paper preview

**Files to edit:**
- `apps/frontend/app/dashboard/generated/page.tsx`

**Actions:**
1. Fetch institution settings from `/settings` on page mount.
2. Use `settings.college_name` and `settings.affiliation` in the preview modal header instead of the hardcoded strings.

---

### Step 10.2 — Supabase Storage for uploaded question bank files

**Context:** Files sent to the parser are not retained anywhere. If the parser logic changes, banks cannot be re-parsed.

**Files to edit:**
- `apps/backend-api/src/questions/questions.service.ts`

**Actions:**
1. Before sending to the parser, upload the file to Supabase Storage bucket `question-banks`:
   ```ts
   await supabaseClient.storage
     .from('question-banks')
     .upload(`${bankId}/${file.originalname}`, file.buffer, { contentType: file.mimetype });
   ```
2. Save the storage path to the `uploads` table (link to `question_banks.id`).
3. Enable bucket with RLS: only authenticated users can read; only the uploader can delete.

---

### Step 10.3 — Mobile responsiveness audit

**Files to audit:**
- `apps/frontend/app/dashboard/layout.tsx` — sidebar navigation
- `apps/frontend/app/dashboard/generate/page.tsx` — 6-step wizard
- `apps/frontend/app/dashboard/library/page.tsx` — question table

**Actions:**
1. Test each page at 375px, 768px, 1280px breakpoints.
2. Sidebar: collapse to hamburger on mobile.
3. Wizard stepper: add `overflow-x-auto` on small screens.
4. Library question table: hide non-critical columns (CO, classification_source) on mobile.

---

## Implementation Priority Matrix

| Priority | Phase | Estimated Effort | Reason |
|---|---|---|---|
| Critical | Phase 1 — Security & RLS | 1 day | Database is completely open |
| Critical | Phase 1.2 — Auth | 1-2 days | Zero access control without it |
| High | Phase 2 — Remove mocks | 1 day | Mock data hides real bugs |
| High | Phase 3 — PDF Export | 2 days | Core deliverable missing |
| Medium | Phase 4 — Settings | 1 day | Easy win, dynamic paper headers |
| Medium | Phase 5 — Intelligence | 1-2 days | Better classification quality |
| Medium | Phase 6 — Generator UX | 1 day | Bug fixes |
| Normal | Phase 7 — HOD Workflow | 2 days | Required for multi-user use |
| Normal | Phase 8 — Health Checks | 0.5 days | Operational visibility |
| Normal | Phase 9 — Code Quality | 1 day | Pre-deployment hardening |
| Polish | Phase 10 — Final Polish | 1 day | Presentation quality |

---

## Final Pre-Deployment Checklist

- [ ] All UNRESTRICTED tables have RLS enabled (Phase 1.1)
- [ ] Login/signup/logout flow works end-to-end (Phase 1.2)
- [ ] All frontend pages pass JWT to backend (Phase 1.3)
- [ ] No `mockData` imports remain in any production page (Phase 2.4)
- [ ] PDF export produces a real downloadable file (Phase 3.1)
- [ ] Institution settings persist in database (Phase 4.1)
- [ ] "Needs Review" filter helps teachers fix low-confidence questions (Phase 5.2)
- [ ] Blueprint ID detection uses UUID regex (Phase 6.1)
- [ ] Question replacement syncs to backend (Phase 6.2)
- [ ] Paper status workflow (Submit → Approve/Reject) works (Phase 7.1)
- [ ] Role-based UI hides HOD-only actions from Teachers (Phase 7.3)
- [ ] Service health badges show live status (Phase 8.1)
- [ ] CORS is restricted to frontend origin (Phase 9.1 & 9.2)
- [ ] Rate limiting is active on upload and generation endpoints (Phase 9.2)
- [ ] `.env` files are in `.gitignore` and no keys are in git history (Phase 9.4)
- [ ] `ValidationPipe` is active globally in NestJS (Phase 1.3)
- [ ] Paper preview and PDF use dynamic institution name from settings (Phase 10.1)

---

*Update this file by marking steps as ✅ when completed.*
