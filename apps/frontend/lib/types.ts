export interface Question {
    id: string;
    text: string;
    marks: number;
    unit: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
}

export interface Blueprint {
    id: string;
    name: string;
    title?: string;
    exam_type?: string;
    subject_code?: string;
    duration_minutes?: number;
    total_marks?: number;
    attempt_marks?: number;
    gross_marks?: number;
    has_or_choices?: boolean;
    sections: BlueprintSection[];
}

export interface BlueprintSection {
    id: string;
    name: string;
    marksPerQuestion: number;
    numberOfQuestions: number;
    totalMarks: number;
    isOrChoice?: boolean;
    pairedWithId?: string;
    pairLabel?: string;
    difficulty?: string[];
    blooms_levels?: string[];
}

export interface GeneratedPaper {
    id: string;
    title: string;
    date: string;
    totalMarks: number;
    blueprintId: string;
}

export interface AuditLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
}

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

export interface SubQuestion {
    id: string;
    sub: string;
    text: string;
    marks: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    blooms_level?: string;
    co?: string;
    pi?: string;
    unit?: string;
}

export interface QuestionGroup {
    queNum: number;
    subQuestions: SubQuestion[];
    orQuestionGroup?: QuestionGroup;
}

