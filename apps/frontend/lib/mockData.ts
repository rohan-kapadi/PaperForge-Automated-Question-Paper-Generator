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

export const mockQuestions: Question[] = [
    {
        id: 'q1',
        text: 'Explain the concept of normalization in database design.',
        marks: 5,
        unit: 'Unit 1',
        difficulty: 'Medium',
        topic: 'Database Design'
    },
    {
        id: 'q2',
        text: 'What are the ACID properties in database transactions?',
        marks: 3,
        unit: 'Unit 2',
        difficulty: 'Easy',
        topic: 'Transactions'
    },
    {
        id: 'q3',
        text: 'Describe the differences between clustered and non-clustered indexes.',
        marks: 7,
        unit: 'Unit 3',
        difficulty: 'Hard',
        topic: 'Indexing'
    },
    {
        id: 'q4',
        text: 'Explain the concept of foreign keys and their importance.',
        marks: 4,
        unit: 'Unit 1',
        difficulty: 'Easy',
        topic: 'Relational Model'
    },
    {
        id: 'q5',
        text: 'What is the difference between DELETE and TRUNCATE commands?',
        marks: 3,
        unit: 'Unit 2',
        difficulty: 'Easy',
        topic: 'SQL Commands'
    },
    {
        id: 'q6',
        text: 'Discuss the various types of joins in SQL with examples.',
        marks: 8,
        unit: 'Unit 3',
        difficulty: 'Hard',
        topic: 'SQL Joins'
    },
    {
        id: 'q7',
        text: 'Explain the concept of database triggers and their applications.',
        marks: 6,
        unit: 'Unit 4',
        difficulty: 'Medium',
        topic: 'Database Objects'
    },
    {
        id: 'q8',
        text: 'What are stored procedures? Explain with an example.',
        marks: 5,
        unit: 'Unit 4',
        difficulty: 'Medium',
        topic: 'Stored Procedures'
    },
    {
        id: 'q9',
        text: 'Describe the CAP theorem in distributed databases.',
        marks: 7,
        unit: 'Unit 5',
        difficulty: 'Hard',
        topic: 'Distributed Systems'
    },
    {
        id: 'q10',
        text: 'What is a view in SQL? Explain its advantages.',
        marks: 4,
        unit: 'Unit 2',
        difficulty: 'Easy',
        topic: 'Database Views'
    },
    {
        id: 'q11',
        text: 'Explain the concept of database sharding.',
        marks: 6,
        unit: 'Unit 5',
        difficulty: 'Medium',
        topic: 'Scalability'
    },
    {
        id: 'q12',
        text: 'What are the different types of database constraints?',
        marks: 5,
        unit: 'Unit 1',
        difficulty: 'Medium',
        topic: 'Constraints'
    }
];

export const mockBlueprints: Blueprint[] = [
    {
        id: 'bp1',
        name: 'Mid-Term Examination Blueprint',
        sections: [
            {
                id: 's1',
                name: 'Section A - Short Answers',
                marksPerQuestion: 3,
                numberOfQuestions: 5,
                totalMarks: 15
            },
            {
                id: 's2',
                name: 'Section B - Long Answers',
                marksPerQuestion: 7,
                numberOfQuestions: 3,
                totalMarks: 21
            }
        ]
    },
    {
        id: 'bp2',
        name: 'End-Term Examination Blueprint',
        sections: [
            {
                id: 's1',
                name: 'Section A - MCQ',
                marksPerQuestion: 1,
                numberOfQuestions: 20,
                totalMarks: 20
            },
            {
                id: 's2',
                name: 'Section B - Short Answers',
                marksPerQuestion: 5,
                numberOfQuestions: 6,
                totalMarks: 30
            },
            {
                id: 's3',
                name: 'Section C - Case Study',
                marksPerQuestion: 10,
                numberOfQuestions: 2,
                totalMarks: 20
            }
        ]
    }
];

export const mockGeneratedPapers: GeneratedPaper[] = [
    {
        id: 'gp1',
        title: 'Database Management Systems - Mid Term',
        date: '2026-02-05',
        totalMarks: 50,
        blueprintId: 'bp1'
    },
    {
        id: 'gp2',
        title: 'Operating Systems - End Term',
        date: '2026-02-08',
        totalMarks: 70,
        blueprintId: 'bp2'
    },
    {
        id: 'gp3',
        title: 'Computer Networks - Mid Term',
        date: '2026-02-10',
        totalMarks: 50,
        blueprintId: 'bp1'
    }
];

export const mockAuditLogs: AuditLog[] = [
    {
        id: 'al1',
        action: 'Generated Paper: Database Management Systems - Mid Term',
        user: 'Dr. Sharma',
        timestamp: '2026-02-05 10:30 AM'
    },
    {
        id: 'al2',
        action: 'Uploaded Question Bank: DBMS_Questions.xlsx',
        user: 'Dr. Patel',
        timestamp: '2026-02-04 02:15 PM'
    },
    {
        id: 'al3',
        action: 'Created Blueprint: End-Term Examination Blueprint',
        user: 'Dr. Sharma',
        timestamp: '2026-02-03 11:45 AM'
    },
    {
        id: 'al4',
        action: 'Modified Question: Q-45 (Unit 3)',
        user: 'Dr. Kumar',
        timestamp: '2026-02-02 04:20 PM'
    },
    {
        id: 'al5',
        action: 'Downloaded Paper: Operating Systems - End Term',
        user: 'Dr. Sharma',
        timestamp: '2026-02-08 09:00 AM'
    }
];
