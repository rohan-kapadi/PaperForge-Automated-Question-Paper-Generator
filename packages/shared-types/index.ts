export interface Question {
  id: string;
  text: string;
  marks: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic?: string;
  section?: string;
}

export interface ExamBlueprint {
  title: string;
  totalMarks: number;
  sections: {
    name: string;
    totalMarks: number;
    questionCount: number;
    difficultyDistribution: {
      Easy: number;
      Medium: number;
      Hard: number;
    };
  }[];
}

export type UserRole = 'Admin' | 'HOD' | 'Teacher' | 'Auditor';
