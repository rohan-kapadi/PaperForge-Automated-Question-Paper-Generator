-- ============================================================================
-- PaperForge / ExamGen — Migration v4: Institution Settings Persistence
-- Phase 4: Institution Settings Persistence
-- ============================================================================
-- HOW TO RUN: Paste and run in Supabase Dashboard > SQL Editor
--
-- GOAL: Store institutional profile, accreditation details, academic year,
-- default durations, and examination headers so that settings persist
-- across browser sessions and feed dynamically into paper generation.
-- ============================================================================

CREATE TABLE IF NOT EXISTS institution_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE institution_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (teachers, HODs, admins) to read settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'institution_settings' AND policyname = 'Authenticated Read Settings'
  ) THEN
    CREATE POLICY "Authenticated Read Settings"
      ON institution_settings FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- Allow Admin and HOD (or authenticated in single-tenant / local dev) to insert and update settings
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'institution_settings' AND policyname = 'Admin Write Settings'
  ) THEN
    CREATE POLICY "Admin Write Settings"
      ON institution_settings FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'HOD')
        )
        OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role IN ('Admin', 'HOD')
        )
        OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
      );
  END IF;
END $$;

-- Default institutional settings pre-population (matching PCET & PCCOER standards)
INSERT INTO institution_settings (key, value) VALUES
  ('trust_name', 'Pimpri Chinchwad Education Trust''s'),
  ('college_name', 'Pimpri Chinchwad College of Engineering & Research Ravet, Pune'),
  ('affiliation', 'An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified'),
  ('iqac_text', 'IQAC PCCOER'),
  ('record_no', 'ACAD/R/11'),
  ('department', 'Computer Engineering'),
  ('default_duration_minutes', '60'),
  ('academic_year', '2025 – 26')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();
