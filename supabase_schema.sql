-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Enum
CREATE TYPE user_role AS ENUM ('Admin', 'HOD', 'Teacher', 'Auditor');

-- Difficulty Enum
CREATE TYPE question_difficulty AS ENUM ('Easy', 'Medium', 'Hard');

-- Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (linked to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'Teacher',
    department_id UUID REFERENCES departments(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question Banks
CREATE TABLE question_banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    marks INTEGER NOT NULL,
    difficulty question_difficulty DEFAULT 'Medium',
    topic TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam Blueprints
CREATE TABLE exam_blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department_id UUID REFERENCES departments(id),
    schema JSONB NOT NULL, -- Stores sections, mark distribution, etc.
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Papers
CREATE TABLE generated_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blueprint_id UUID REFERENCES exam_blueprints(id),
    content JSONB NOT NULL, -- The specific questions selected
    pdf_url TEXT,
    status TEXT DEFAULT 'Pending', -- Pending, Generated, Failed
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS POLICIES (Example)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Basic policy: Everyone can read departments
CREATE POLICY "Public Read Departments" ON departments FOR SELECT USING (true);

-- Users can only read their own profile
CREATE POLICY "Read Own Profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Department-based access for questions
CREATE POLICY "Department Access Questions" ON questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM question_banks
            JOIN profiles ON profiles.department_id = question_banks.department_id
            WHERE question_banks.id = questions.bank_id
            AND profiles.id = auth.uid()
        )
    );
