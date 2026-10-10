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
    sections: BlueprintSection[];
}

export interface BlueprintSection {
    id: string;
    name: string;
    marksPerQuestion: number;
    numberOfQuestions: number;
    totalMarks: number;
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
