-- ============================================================================
-- PaperForge: Safe Migration v2.0 — Question Intelligence
-- ============================================================================
-- HOW TO RUN: Paste this in Supabase Dashboard > SQL Editor > Run
--
-- SAFETY GUARANTEES:
--   * Uses ADD COLUMN IF NOT EXISTS (never fails if already applied)
--   * Never drops or modifies existing columns or data
--   * Idempotent — safe to run multiple times
-- ============================================================================

-- PHASE 1: Add Question Intelligence columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'Short Answer';
ALTER TABLE questions ADD COLUMN IF NOT EXISTS classification_source TEXT DEFAULT 'ai';

-- PHASE 2: Add upload tracking to question_banks
ALTER TABLE question_banks ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE question_banks ADD COLUMN IF NOT EXISTS file_type TEXT;

-- PHASE 3: Complete generated_papers table columns for autonomous examination papers
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Examination Paper';
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'Unit_Test_1';
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS set_name TEXT DEFAULT 'Set A';
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Generated';
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS content JSONB;
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS docx_url TEXT;
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS moderation_comments TEXT;
ALTER TABLE generated_papers ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- PHASE 3: Development RLS Policies
-- Allows the backend (anon key) to work without JWT auth during development.
-- IMPORTANT: Replace with proper authenticated policies before production.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_banks' AND policyname = 'Dev Anon Access Banks') THEN
        CREATE POLICY "Dev Anon Access Banks" ON question_banks FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'questions' AND policyname = 'Dev Anon Access Questions') THEN
        CREATE POLICY "Dev Anon Access Questions" ON questions FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_blueprints' AND policyname = 'Dev Anon Access Blueprints') THEN
        CREATE POLICY "Dev Anon Access Blueprints" ON exam_blueprints FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generated_papers' AND policyname = 'Dev Anon Access Papers') THEN
        CREATE POLICY "Dev Anon Access Papers" ON generated_papers FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Dev Anon Access Audit') THEN
        CREATE POLICY "Dev Anon Access Audit" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    RAISE NOTICE 'PaperForge Migration v2.0 applied successfully.';
END $$;

-- VERIFY: Run after migration to confirm
SELECT table_name, column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('questions', 'question_banks')
ORDER BY table_name, ordinal_position;
