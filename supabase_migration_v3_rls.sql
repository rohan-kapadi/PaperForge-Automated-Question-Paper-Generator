-- ============================================================================
-- PaperForge / ExamGen — Migration v3: Row Level Security (RLS) Hardening
-- Phase 1: Security & Database Hardening
-- ============================================================================
-- HOW TO RUN: Paste and run in Supabase Dashboard > SQL Editor
--
-- GOAL: Secure all unrestricted tables in the database against unauthenticated
-- access via the public anon key.
-- ============================================================================

-- STEP 1: blueprints (legacy/active blueprint tables)
ALTER TABLE IF EXISTS blueprints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprints' AND policyname = 'Authenticated Read Blueprints') THEN
    CREATE POLICY "Authenticated Read Blueprints" ON blueprints FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprints' AND policyname = 'Authenticated Write Blueprints') THEN
    CREATE POLICY "Authenticated Write Blueprints" ON blueprints FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- STEP 2: blueprint_sections
ALTER TABLE IF EXISTS blueprint_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blueprint_sections' AND policyname = 'Authenticated Access Blueprint Sections') THEN
    CREATE POLICY "Authenticated Access Blueprint Sections" ON blueprint_sections FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- STEP 3: paper_questions
ALTER TABLE IF EXISTS paper_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'paper_questions' AND policyname = 'Authenticated Access Paper Questions') THEN
    CREATE POLICY "Authenticated Access Paper Questions" ON paper_questions FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- STEP 4: subjects (Admin/HOD write, all authenticated read)
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Authenticated Read Subjects') THEN
    CREATE POLICY "Authenticated Read Subjects" ON subjects FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Admin Write Subjects') THEN
    CREATE POLICY "Admin Write Subjects" ON subjects FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'HOD')
    ));
  END IF;
END $$;

-- STEP 5: uploads (owner only)
ALTER TABLE IF EXISTS uploads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'uploads' AND policyname = 'Owner Access Uploads') THEN
    CREATE POLICY "Owner Access Uploads" ON uploads FOR ALL TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- STEP 6: users (treat as profiles mirror — owner only)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Owner Access Users') THEN
    CREATE POLICY "Owner Access Users" ON users FOR ALL TO authenticated USING (id = auth.uid());
  END IF;
END $$;
