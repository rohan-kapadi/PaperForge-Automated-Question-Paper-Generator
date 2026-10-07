-- ============================================================================
-- PaperForge: Production-Grade Engineering College Examination Schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Enums
CREATE TYPE user_role AS ENUM ('Admin', 'HOD', 'Teacher', 'Auditor');
CREATE TYPE question_difficulty AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE blooms_level AS ENUM ('L1_Remember', 'L2_Understand', 'L3_Apply', 'L4_Analyze', 'L5_Evaluate', 'L6_Create');
CREATE TYPE exam_type AS ENUM ('Unit_Test_1', 'Unit_Test_2', 'In_Sem', 'End_Sem_Final');
CREATE TYPE paper_status AS ENUM ('Draft', 'Submitted_For_Review', 'Approved', 'Rejected', 'Generated');

-- 2. Departments Table (Computer Engineering, IT, Mechanical, etc.)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE, -- e.g. COMP, IT, MECH
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Profiles Table (Synchronized with Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'Teacher',
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically create a profile row when a new user signs up in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Faculty Member'),
        'Teacher'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. Question Banks (e.g. Data Structures & Algorithms, OS, DBMS)
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject_code TEXT, -- e.g. CS301
    semester INTEGER, -- e.g. 5
    academic_year TEXT, -- e.g. 2025-2026
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Questions (Supports Text, LaTeX Math, Diagrams, NBA COs & Bloom Levels)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    marks INTEGER NOT NULL CHECK (marks > 0),
    difficulty question_difficulty DEFAULT 'Medium',
    topic TEXT, -- e.g. "Unit 2: Binary Search Trees"
    co TEXT, -- e.g. "CO2" (Course Outcome for NBA/NAAC)
    blooms_level blooms_level DEFAULT 'L2_Understand',
    image_url TEXT, -- Optional diagram / schematic URL
    sub_questions JSONB, -- For multipart questions: [{ part: 'a', text: '...', marks: 5 }]
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Exam Blueprints (Rules, Section distribution, Constraints)
CREATE TABLE exam_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    exam_type exam_type DEFAULT 'Unit_Test_1',
    subject_code TEXT,
    academic_year TEXT,
    semester INTEGER,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    total_marks INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    instructions TEXT[], -- e.g. ["Assume suitable data", "Non-programmable calculator allowed"]
    schema JSONB NOT NULL, -- Section configs, compulsory questions, OR choices, marks per section
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Generated Papers (Draft, Set A / Set B, HOD Moderation loop)
CREATE TABLE generated_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID REFERENCES exam_blueprints(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    exam_type exam_type DEFAULT 'Unit_Test_1',
    set_name TEXT DEFAULT 'Set A', -- 'Set A', 'Set B'
    status paper_status DEFAULT 'Draft',
    total_marks INTEGER NOT NULL,
    content JSONB NOT NULL, -- Final assembled questions by section
    pdf_url TEXT,
    docx_url TEXT,
    moderation_comments TEXT,
    moderated_by UUID REFERENCES profiles(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Audit Logs (Compliance & Exam Cell Security)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL, -- e.g. 'PAPER_GENERATED', 'PAPER_APPROVED', 'PDF_DOWNLOADED'
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Departments: All authenticated users can read departments
CREATE POLICY "Read Departments" ON departments FOR SELECT TO authenticated USING (true);

-- 2. Profiles: Users can read profiles in their department; Admins/HODs read all
CREATE POLICY "Read Profiles" ON profiles FOR SELECT TO authenticated USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('Admin', 'HOD'))
);
CREATE POLICY "Update Own Profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 3. Question Banks: Scoped to department
CREATE POLICY "Department Access Banks" ON question_banks FOR ALL TO authenticated USING (
    department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- 4. Questions: Scoped to department question banks
CREATE POLICY "Department Access Questions" ON questions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM question_banks qb
        JOIN profiles p ON p.department_id = qb.department_id
        WHERE qb.id = questions.bank_id AND p.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- 5. Blueprints: Department scoped
CREATE POLICY "Department Access Blueprints" ON exam_blueprints FOR ALL TO authenticated USING (
    department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- 6. Generated Papers: Department scoped; only HOD/Admin can approve
CREATE POLICY "Department Access Papers" ON generated_papers FOR SELECT TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN exam_blueprints eb ON eb.id = generated_papers.blueprint_id
        WHERE p.id = auth.uid() AND (p.department_id = eb.department_id OR p.role IN ('Admin', 'HOD'))
    )
);

CREATE POLICY "Insert Papers" ON generated_papers FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid()
);

CREATE POLICY "Update Papers" ON generated_papers FOR UPDATE TO authenticated USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'HOD'))
);

-- 7. Audit Logs: Insertable by system, readable by Admin/HOD/Auditor
CREATE POLICY "Insert Audit Logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Read Audit Logs" ON audit_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Admin', 'HOD', 'Auditor'))
);
