'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, Printer, RefreshCw, Edit3, Trash2, CheckCircle2, FileText, Plus, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface QuestionItem {
    id?: string;
    que?: string;
    sub?: string;
    text: string;
    marks?: number;
    co?: string;
    blooms_level?: string;
    difficulty?: string;
    pi?: string;
    topic?: string;
    unit?: string;
    type?: 'OR' | 'QUESTION';
}

export interface CourseOutcome {
    co: string;
    desc: string;
    bt: string;
}

export interface CollegeQuestionPaperProps {
    paper?: any;
    academicYear?: string;
    term?: string;
    examType?: string;
    department?: string;
    subjectName?: string;
    subjectCode?: string;
    className?: string;
    div?: string;
    maxMarks?: number | string;
    duration?: string;
    date?: string;
    recordNo?: string;
    rev?: string;
    revDate?: string;
    trustName?: string;
    collegeName?: string;
    affiliation?: string;
    iqacText?: string;
    courseOutcomes?: CourseOutcome[];
    editable?: boolean;
    onReplaceQuestion?: (secIdx: number, qIdx: number) => void;
    onEditQuestion?: (secIdx: number, qIdx: number, q: any) => void;
    onRemoveQuestion?: (secIdx: number, qIdx: number) => void;
    onQuestionsChange?: (questions: any[]) => void;
}

interface StructuredQuestionItem {
    id: string;
    type: 'QUESTION' | 'OR';
    queNum?: number | string;
    sub?: string;
    text?: string;
    marks_co_btl?: string;
    pi?: string;
    raw?: any;
    secIdx?: number;
    qIdx?: number;
}

function generateInitialQuestions(paper: any): StructuredQuestionItem[] {
    const structuredQuestions: StructuredQuestionItem[] = [];

    if (paper?.sections && paper.sections.length > 0) {
        paper.sections.forEach((sec: any, secIdx: number) => {
            // Check if this section is an OR alternative:
            // 1. Explicitly flagged as isOrChoice / is_or_choice from blueprint
            // 2. Or name contains "OR" (e.g. "Que 2 (OR)", "OR Alternative")
            // Note: If explicitly marked false, it is NEVER an OR choice.
            const isExplicitFalse = sec.isOrChoice === false || sec.is_or_choice === false;
            const isExplicitTrue = sec.isOrChoice === true || sec.is_or_choice === true;

            const isOrChoice = secIdx > 0 && (
                isExplicitTrue ||
                (!isExplicitFalse && (
                    /\bOR\b/i.test(sec.name || '') ||
                    (Boolean(paper.use_or_pairing) && secIdx % 2 === 1)
                ))
            );

            // Insert OR separator ONLY before this section if it is an OR choice
            if (isOrChoice) {
                structuredQuestions.push({
                    id: `or-sec-${secIdx}`,
                    type: 'OR',
                });
            }

            // Extract question number from section name (e.g. "Q1)", "Que 1", "Question 2") or secIdx + 1
            const queMatch = sec.name?.match(/Q(?:ue|uestion)?\s*(\d+)/i);
            const queNum = queMatch ? parseInt(queMatch[1], 10) : (secIdx + 1);

            const secQs = sec.questions || [];
            secQs.forEach((q: any, qIdx: number) => {
                const subLetter = String.fromCharCode(65 + qIdx);
                const btl = q.blooms_level ? q.blooms_level.split('_')[0] : 'L2';
                const coVal = q.co || `CO${(secIdx % 3) + 1}`;
                const marksVal = q.marks || sec.marksPerQuestion || 5;

                structuredQuestions.push({
                    id: `q-${secIdx}-${qIdx}-${queNum}-${subLetter}`,
                    type: 'QUESTION',
                    queNum: queNum,
                    sub: subLetter,
                    text: q.text || '',
                    marks_co_btl: `${marksVal} / ${coVal} / ${btl}`,
                    pi: q.pi || '1.1.1',
                    raw: q,
                    secIdx,
                    qIdx,
                });
            });
        });
    } else {
        // Fallback default sample questions matching standard PCCOER format
        const sampleList = [
            { que: 1, sub: 'A', text: 'Explain the three-tier database architecture with a neat schematic diagram.', marks: '5 / CO1 / L2', pi: '1.3.1' },
            { que: 1, sub: 'B', text: 'Differentiate between File Processing System and Database Management System.', marks: '5 / CO1 / L2', pi: '1.3.1' },
            { que: 1, sub: 'C', text: 'State the roles and responsibilities of a Database Administrator (DBA).', marks: '5 / CO1 / L1', pi: '1.2.1' },
            { type: 'OR' as const },
            { que: 2, sub: 'A', text: 'Define Data Independence. Explain Logical and Physical Data Independence with examples.', marks: '5 / CO1 / L2', pi: '1.3.1' },
            { que: 2, sub: 'B', text: 'Construct an ER diagram for a Hospital Management System with appropriate entities, attributes, and relationships.', marks: '5 / CO2 / L3', pi: '2.1.2' },
            { que: 2, sub: 'C', text: 'Explain generalization, specialization, and aggregation with suitable illustrations.', marks: '5 / CO2 / L2', pi: '2.1.1' },
            { que: 3, sub: 'A', text: 'What is Relational Algebra? Explain fundamental relational algebra operations with examples.', marks: '5 / CO3 / L2', pi: '1.4.1' },
            { que: 3, sub: 'B', text: 'Given relation schema Employee(eid, ename, salary, did), write relational algebra expressions to retrieve employees with salary > 50000.', marks: '5 / CO3 / L3', pi: '2.2.1' },
            { que: 3, sub: 'C', text: 'Explain Primary Key, Foreign Key, Candidate Key, and Super Key with schema examples.', marks: '5 / CO2 / L2', pi: '1.2.2' },
            { type: 'OR' as const },
            { que: 4, sub: 'A', text: 'Explain various DDL and DML commands in SQL with their syntax and sample queries.', marks: '5 / CO3 / L2', pi: '1.4.1' },
            { que: 4, sub: 'B', text: 'Discuss aggregate functions in SQL (COUNT, SUM, AVG, MIN, MAX) along with GROUP BY and HAVING clauses.', marks: '5 / CO3 / L3', pi: '2.2.2' },
            { que: 4, sub: 'C', text: 'Illustrate nested subqueries and correlated subqueries with suitable relational queries.', marks: '5 / CO3 / L3', pi: '2.2.2' },
        ];
        sampleList.forEach((item, idx) => {
            if (item.type === 'OR') {
                structuredQuestions.push({
                    id: `or-sample-${idx}`,
                    type: 'OR',
                });
            } else {
                structuredQuestions.push({
                    id: `q-sample-${idx}-${item.que}-${item.sub}`,
                    type: 'QUESTION',
                    queNum: item.que,
                    sub: item.sub,
                    text: item.text,
                    marks_co_btl: item.marks,
                    pi: item.pi,
                });
            }
        });
    }

    return structuredQuestions;
}

export default function CollegeQuestionPaper({
    paper,
    academicYear = '2025 – 26',
    term = 'II',
    examType = 'UNIT TEST',
    department = 'Computer Engineering',
    subjectName = 'Database Management Systems',
    subjectCode = 'CS301PC',
    className: studentClass = 'TE',
    div = 'A, B, C, D, E, F',
    maxMarks = 30,
    duration = '60 Min',
    date = '01-09-2025',
    recordNo = 'ACAD/R/11',
    rev = '00',
    revDate = '01-09-2025',
    trustName,
    collegeName,
    affiliation,
    iqacText,
    courseOutcomes,
    editable = false,
    onReplaceQuestion,
    onEditQuestion,
    onRemoveQuestion,
    onQuestionsChange,
}: CollegeQuestionPaperProps) {
    const [isExportingDocx, setIsExportingDocx] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(true);

    // Default COs
    const defaultCOs: CourseOutcome[] = [
        { co: 'CO1', desc: 'Understand the fundamental concepts, architectures, and theoretical foundations.', bt: 'L2' },
        { co: 'CO2', desc: 'Apply core design techniques, models, and computational methodologies.', bt: 'L3' },
        { co: 'CO3', desc: 'Formulate, implement, and analyze optimized solutions for technical problem statements.', bt: 'L3' },
    ];

    // Editable state for Course Outcomes
    const [localCOs, setLocalCOs] = useState<CourseOutcome[]>(courseOutcomes || defaultCOs);

    // Editable state for Questions
    const [questionsList, setQuestionsList] = useState<StructuredQuestionItem[]>(() => generateInitialQuestions(paper));

    // Synchronize when props change
    useEffect(() => {
        if (courseOutcomes && courseOutcomes.length > 0) {
            setLocalCOs(courseOutcomes);
        }
    }, [courseOutcomes]);

    useEffect(() => {
        setQuestionsList(generateInitialQuestions(paper));
    }, [paper]);

    // Outcome mutators
    const updateCO = (index: number, field: keyof CourseOutcome, value: string) => {
        setLocalCOs(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    };

    const addCO = () => {
        const nextNum = localCOs.length + 1;
        setLocalCOs(prev => [
            ...prev,
            { co: `CO${nextNum}`, desc: 'Enter course outcome statement and competencies.', bt: 'L3' }
        ]);
    };

    const removeCO = (index: number) => {
        if (localCOs.length <= 1) return;
        setLocalCOs(prev => prev.filter((_, idx) => idx !== index));
    };

    // Question mutators
    const updateQuestion = (id: string, field: 'marks_co_btl' | 'pi' | 'text', value: string) => {
        setQuestionsList(prev => {
            const nextList = prev.map(q => q.id === id ? { ...q, [field]: value } : q);
            if (onQuestionsChange) {
                onQuestionsChange(nextList);
            }
            return nextList;
        });
    };

    // Resolve details from paper object if provided
    const header = paper?.content?.header || {};
    const resolvedSubject = header.subject_name || paper?.title || paper?.subject || subjectName;
    const resolvedExamType = header.exam_type_display || paper?.exam_type || header.exam_type || examType;
    const resolvedMarks = paper?.total_marks || paper?.totalMarks || header.max_marks || maxMarks;
    const resolvedDuration = header.duration || (header.duration_minutes ? `${header.duration_minutes} Min` : duration);
    const resolvedDate = header.exam_date || paper?.date || date;
    const resolvedCode = header.subject_code || subjectCode;
    const resolvedDept = header.department || department;
    const resolvedClass = header.student_class || studentClass;
    const resolvedDiv = header.div || div;
    const resolvedAy = header.academic_year || academicYear;
    const resolvedTerm = header.term || term;
    const resolvedRecordNo = header.record_no || recordNo;
    const resolvedRev = header.rev || rev;
    const resolvedRevDate = header.rev_date || revDate;
    const resolvedTrustName = header.trust_name || trustName || "Pimpri Chinchwad Education Trust's";
    const resolvedCollegeName = header.college_name || collegeName || "Pimpri Chinchwad College of Engineering & Research Ravet, Pune";
    const resolvedAffiliation = header.affiliation || affiliation || "An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified";
    const resolvedIqac = header.iqac_text || iqacText || "IQAC PCCOER";

    // -------------------------------------------------------------------------
    // ATOMIC QUESTION GROUPING & DYNAMIC PAGE DISTRIBUTION
    // Rule:
    // 1. Pack as many questions as fit on Page 1.
    // 2. If an entire question block (with its sub-questions and leading OR) would
    //    split across Page 1 and Page 2, move that whole question to Page 2!
    // 3. Do not split based on arbitrary question numbers.
    // -------------------------------------------------------------------------
    interface QuestionBlock {
        queNum: number;
        items: StructuredQuestionItem[];
        estimatedHeight: number;
    }

    const questionBlocks: QuestionBlock[] = [];
    let currentBlock: QuestionBlock | null = null;
    let pendingOrSeparator: StructuredQuestionItem | null = null;

    questionsList.forEach((item) => {
        if (item.type === 'OR') {
            pendingOrSeparator = item;
        } else {
            const qNum = Number(item.queNum) || (questionBlocks.length + 1);
            if (!currentBlock || currentBlock.queNum !== qNum) {
                currentBlock = {
                    queNum: qNum,
                    items: [],
                    estimatedHeight: 0,
                };
                if (pendingOrSeparator) {
                    currentBlock.items.push(pendingOrSeparator);
                    currentBlock.estimatedHeight += 30; // Height of OR separator row
                    pendingOrSeparator = null;
                }
                questionBlocks.push(currentBlock);
            }
            currentBlock.items.push(item);
            const textLen = (item.text || '').length;
            const lines = Math.max(1, Math.ceil(textLen / 55));
            const rowHeight = Math.max(46, 20 + lines * 24);
            currentBlock.estimatedHeight += rowHeight;
        }
    });

    // Calculate usable heights for questions:
    // A4 sheet is min-h-[1050px].
    // Page 1 fixed content: Header Box (~140px) + Metadata (~75px with spacing) + Notes (~45px with spacing) +
    // Course Outcomes (~30px header + localCOs.length * 32px + 20px spacing) + Questions Table Header (~32px) + Footer (~40px)
    const page1FixedOverhead = 140 + 75 + 45 + (30 + localCOs.length * 32 + 20) + 32 + 40;
    const maxPage1QuestionHeight = Math.max(350, 1050 - page1FixedOverhead);

    // Subsequent pages have NO Header, Metadata, or Course Outcomes:
    const maxSubsequentPageHeight = 1050 - 40 - 50; // ~960px

    const pages: StructuredQuestionItem[][] = [[]];
    let currentPageIndex = 0;
    let currentPageUsedHeight = 0;

    questionBlocks.forEach((block) => {
        const pageLimit = currentPageIndex === 0 ? maxPage1QuestionHeight : maxSubsequentPageHeight;

        // Check if this entire question block fits on the current page:
        if (currentPageUsedHeight === 0 || (currentPageUsedHeight + block.estimatedHeight <= pageLimit)) {
            // It fits completely on current page!
            pages[currentPageIndex].push(...block.items);
            currentPageUsedHeight += block.estimatedHeight;
        } else {
            // THIS QUESTION WOULD SPLIT ACROSS THE PAGE BOUNDARY!
            // Rule: Take the ENTIRE question and put it onto the next page!
            currentPageIndex += 1;
            pages[currentPageIndex] = [...block.items];
            currentPageUsedHeight = block.estimatedHeight;
        }
    });

    const page1Items = pages[0] || [];
    const totalPagesCount = pages.filter(p => p.length > 0).length;

    // Dynamic Solve Note based on question numbers and OR choices
    const uniqueQueNums = Array.from(new Set(questionsList.filter(q => q.type === 'QUESTION' && q.queNum).map(q => Number(q.queNum)))).sort((a, b) => a - b);
    const hasOrInList = questionsList.some(q => q.type === 'OR');
    let dynamicSolveNote = '1. Answer all questions in sequential order.';
    if (hasOrInList) {
        if (uniqueQueNums.length >= 8) {
            dynamicSolveNote = '1. Solve Que.1 or Que.2, Que.3 or Que.4, Que.5 or Que.6 and Que.7 or Que.8.';
        } else if (uniqueQueNums.length >= 6) {
            dynamicSolveNote = '1. Solve Que.1 or Que.2, Que.3 or Que.4 and Que.5 or Que.6.';
        } else if (uniqueQueNums.length >= 4) {
            dynamicSolveNote = '1. Solve Que.1 or Que.2 and Que.3 or Que.4.';
        } else if (uniqueQueNums.length >= 2) {
            dynamicSolveNote = '1. Solve Que.1 or Que.2.';
        }
    }

    const handleDownloadDocx = async () => {
        setIsExportingDocx(true);
        try {
            const payload = {
                department: resolvedDept,
                subject: resolvedSubject,
                subject_code: resolvedCode,
                class: resolvedClass,
                div: resolvedDiv,
                academic_year: resolvedAy,
                term: resolvedTerm,
                exam_type: resolvedExamType,
                max_marks: resolvedMarks,
                duration: resolvedDuration,
                date: resolvedDate,
                record_no: resolvedRecordNo,
                rev: resolvedRev,
                rev_date: resolvedRevDate,
                co_list: localCOs,
                questions: questionsList.map(q => ({
                    type: q.type,
                    que: q.queNum?.toString() || '',
                    sub: q.sub || '',
                    text: q.text || '',
                    marks_co_btl: q.marks_co_btl || '',
                    pi: q.pi || '',
                })),
                sections: paper?.sections || [],
            };

            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const parserUrl = 'http://localhost:8000';

            // Try backend export first, fallback to parser-service
            let res = await fetch(`${backendUrl}/papers/export/docx`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(() => null);

            if (!res || !res.ok) {
                res = await fetch(`${parserUrl}/export-pccoer-docx`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (!res.ok) throw new Error('Export failed');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${resolvedSubject.replace(/\s+/g, '_')}_PCCOER_${resolvedExamType.replace(/\s+/g, '_')}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export DOCX:', err);
            alert('Could not download Word document. Ensure backend services are running.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    const parseMarksCoBtl = (val?: string) => {
        if (!val) return { marks: '(Marks-05)', co: '[CO1]', bt: 'BT2' };
        const parts = val.split('/').map(s => s.trim());
        const marksDigits = parts[0]?.match(/\d+/)?.[0];
        const marksStr = marksDigits ? `(Marks-${marksDigits.padStart(2, '0')})` : (parts[0]?.startsWith('(') ? parts[0] : `(${parts[0] || 'Marks-05'})`);
        const coRaw = parts[1] || 'CO1';
        const coClean = coRaw.replace(/^[\[\(]+|[\]\)]+$/g, '');
        const coStr = `[${coClean}]`;
        const btRaw = parts[2] || 'BT2';
        const btMatch = btRaw.match(/(?:BT|L)?\s*(\d+)/i);
        const btStr = btMatch ? `BT${btMatch[1]}` : btRaw;
        return { marks: marksStr, co: coStr, bt: btStr };
    };

    const renderQuestionTable = (items: StructuredQuestionItem[], pagePrefix: string) => (
        <table className="w-full border-collapse border border-black text-[12pt]" style={{ tableLayout: 'fixed', fontSize: '12pt' }}>
            <thead>
                <tr className="border-b border-black text-center font-bold text-[12pt]" style={{ fontSize: '12pt' }}>
                    <th className="border-r border-black p-1.5 text-center font-bold" style={{ width: '6%' }}>Que</th>
                    <th className="border-r border-black p-1.5 text-center font-bold leading-tight" style={{ width: '8%' }}>
                        Sub<br />Que.
                    </th>
                    <th className="border-r border-black p-1.5 text-center font-bold" style={{ width: '62%' }}>Questions</th>
                    <th className="border-r border-black p-1.5 text-center font-bold leading-tight" style={{ width: '15%' }}>
                        Marks/<br />CO/BTL
                    </th>
                    <th className="p-1.5 text-center font-bold" style={{ width: '9%' }}>PI</th>
                </tr>
            </thead>
            <tbody>
                {items.map((q, idx) => {
                    if (q.type === 'OR') {
                        return (
                            <tr key={`${pagePrefix}-or-${idx}`} className="border-b border-black bg-slate-50 print:bg-transparent">
                                <td colSpan={5} className="p-1.5 text-center font-bold tracking-widest text-[12pt]">
                                    OR
                                </td>
                            </tr>
                        );
                    }

                    // Vertically merge Que column for contiguous sub-questions on this page
                    const prevItem = idx > 0 ? items[idx - 1] : null;
                    const isFirstInQueGroup = !prevItem || prevItem.type === 'OR' || prevItem.queNum !== q.queNum;
                    let groupRowSpan = 1;
                    if (isFirstInQueGroup) {
                        let spanCount = 1;
                        for (let i = idx + 1; i < items.length; i++) {
                            if (items[i].type === 'QUESTION' && items[i].queNum === q.queNum) {
                                spanCount++;
                            } else {
                                break;
                            }
                        }
                        groupRowSpan = spanCount;
                    }

                    const parsedMarks = parseMarksCoBtl(q.marks_co_btl);

                    return (
                        <tr key={q.id || `${pagePrefix}-q-${idx}`} className="border-b border-black align-top group text-[12pt]">
                            {isFirstInQueGroup && (
                                <td
                                    rowSpan={groupRowSpan}
                                    className="border-r border-b border-black p-2 text-center font-bold text-[12pt] align-middle"
                                >
                                    {q.queNum}
                                </td>
                            )}
                            <td className="border-r border-black p-2 text-center font-bold text-[12pt] align-middle">
                                {q.sub}
                            </td>
                            <td className="border-r border-black p-2 leading-relaxed relative text-[12pt]">
                                {isEditingMode ? (
                                    <textarea
                                        value={q.text}
                                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                        rows={2}
                                        className="w-full bg-amber-50/30 hover:bg-amber-50/70 focus:bg-white border border-dashed border-amber-200 focus:border-amber-500 rounded p-1.5 text-[12pt] font-serif leading-relaxed text-black focus:outline-none print:border-none print:bg-transparent print:p-0 resize-y"
                                        style={{ fontSize: '12pt' }}
                                        placeholder="Question text..."
                                    />
                                ) : (
                                    <div className="text-[12pt] leading-relaxed font-serif">{q.text}</div>
                                )}

                                {/* Contextual actions for wizard editing */}
                                {editable && q.raw && (
                                    <div className="no-print hidden group-hover:flex items-center space-x-1 mt-1 pt-1 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => onReplaceQuestion && onReplaceQuestion(q.secIdx ?? 0, q.qIdx ?? 0)}
                                            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-sans flex items-center"
                                        >
                                            <RefreshCw className="w-2.5 h-2.5 mr-1" /> Replace
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onEditQuestion && onEditQuestion(q.secIdx ?? 0, q.qIdx ?? 0, q.raw)}
                                            className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 px-2 py-0.5 rounded font-sans flex items-center"
                                        >
                                            <Edit3 className="w-2.5 h-2.5 mr-1" /> Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onRemoveQuestion && onRemoveQuestion(q.secIdx ?? 0, q.qIdx ?? 0)}
                                            className="text-[10px] bg-red-100 hover:bg-red-200 text-red-900 px-1.5 py-0.5 rounded font-sans"
                                        >
                                            <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="border-r border-black p-1.5 text-center align-middle">
                                {isEditingMode ? (
                                    <div className="space-y-0.5">
                                        <input
                                            type="text"
                                            value={q.marks_co_btl}
                                            onChange={(e) => updateQuestion(q.id, 'marks_co_btl', e.target.value)}
                                            className="w-full text-center bg-amber-50/50 hover:bg-amber-50 focus:bg-white border border-dashed border-amber-400 focus:border-amber-600 rounded p-0.5 text-[10.5pt] font-serif font-bold text-black focus:outline-none print:border-none print:bg-transparent print:p-0"
                                            placeholder="5 / CO1 / L2"
                                            title="Edit Marks / CO / BT Level (e.g. 5 / P251.1 / BT6)"
                                        />
                                        <div className="text-[10pt] leading-tight text-slate-700 print:hidden">
                                            <div>{parsedMarks.marks}</div>
                                            <div className="font-bold">{parsedMarks.co}</div>
                                            <div className="font-bold">{parsedMarks.bt}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center font-serif leading-snug py-0.5">
                                        <span className="text-[11pt] text-black font-normal">{parsedMarks.marks}</span>
                                        <span className="text-[11pt] font-bold text-black">{parsedMarks.co}</span>
                                        <span className="text-[11pt] font-bold text-black">{parsedMarks.bt}</span>
                                    </div>
                                )}
                            </td>
                            <td className="p-1.5 text-center align-middle">
                                {isEditingMode ? (
                                    <input
                                        type="text"
                                        value={q.pi}
                                        onChange={(e) => updateQuestion(q.id, 'pi', e.target.value)}
                                        className="w-full text-center bg-amber-50/50 hover:bg-amber-50 focus:bg-white border border-dashed border-amber-400 focus:border-amber-600 rounded p-0.5 text-[10.5pt] font-serif text-black focus:outline-none print:border-none print:bg-transparent print:p-0"
                                        placeholder="1.1.1"
                                        title="Edit Performance Indicator (e.g. 1.3.1, 2.3.1)"
                                    />
                                ) : (
                                    <div className="whitespace-pre-line leading-tight text-[10.5pt] font-serif">{q.pi}</div>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div className="space-y-4">
            {/* Top Toolbar Actions */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-white">Official Format:</span>
                    <span>PCET PCCOER Ravet Autonomous Exam Standard (ACAD/R/11)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Faculty Quick Edit Toggle */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingMode(!isEditingMode)}
                        className={cn(
                            "text-xs h-8 font-semibold transition-all",
                            isEditingMode
                                ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400 shadow-sm"
                                : "bg-slate-950 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800"
                        )}
                        title="Click to enable or disable modifying Marks, CO, PI, and Outcomes"
                    >
                        {isEditingMode ? (
                            <>
                                <Check className="w-3.5 h-3.5 mr-1 text-slate-950" />
                                Done Editing
                            </>
                        ) : (
                            <>
                                <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                Edit Marks, CO, PI & Outcomes
                            </>
                        )}
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadDocx}
                        disabled={isExportingDocx}
                        className="bg-slate-950 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 text-xs h-8"
                    >
                        <Download className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        {isExportingDocx ? 'Generating Word...' : 'Export Word (.docx)'}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => window.print()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 shadow-sm"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* Advisory Bar when Faculty Edit Mode is Active */}
            {isEditingMode && (
                <div className="no-print bg-amber-500/10 border border-amber-500/30 text-amber-200 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-inner">
                    <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                            <strong>Faculty Customization Active:</strong> Click on any cell below to change <strong>Course Outcomes</strong>, <strong>BT Level</strong>, <strong>Marks / CO / BTL</strong>, or <strong>PI</strong>. All edits will be preserved in your downloaded PDF and Word exports.
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsEditingMode(false)}
                        className="text-[11px] underline text-amber-400 hover:text-white flex-shrink-0 font-medium"
                    >
                        View Official Print Preview
                    </button>
                </div>
            )}

            {/* A4 Paper Sheet Container */}
            <div className="pccoer-paper-container mx-auto bg-white text-black font-serif shadow-2xl rounded-sm print:shadow-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:w-full select-text"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}>

                {/* ========================================================================= */}
                {/* PAGE 1                                                                    */}
                {/* ========================================================================= */}
                <div className="min-h-[1050px] print:min-h-0 print:h-auto flex flex-col justify-between">
                    <div>
                        {/* 1. Header Box Table */}
                        <div className="border border-black">
                            {/* Row 1: Logo Left | Center Title | Logo Right */}
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-2 border-r border-black p-2 flex items-center justify-center">
                                    <img
                                        src="/logos/pccoer_logo.png"
                                        alt="PCCOER Logo"
                                        className="max-h-20 w-auto object-contain"
                                    />
                                </div>
                                <div className="col-span-8 p-2 text-center flex flex-col justify-center">
                                    <h4 className="text-[13px] font-bold tracking-tight">{resolvedTrustName}</h4>
                                    <h2 className="text-[15px] font-bold tracking-normal leading-tight pt-0.5">
                                        {resolvedCollegeName}
                                    </h2>
                                    <p className="text-[10px] leading-tight pt-1 text-black">
                                        {resolvedAffiliation}
                                    </p>
                                    <h5 className="text-[12px] font-bold pt-0.5">{resolvedIqac}</h5>
                                </div>
                                <div className="col-span-2 border-l border-black p-2 flex items-center justify-center">
                                    <img
                                        src="/logos/pcet_logo.png"
                                        alt="PCET Logo"
                                        className="max-h-20 w-auto object-contain"
                                    />
                                </div>
                            </div>
                            {/* Row 2: Academic Year | UNIT TEST | Record No */}
                            <div className="grid grid-cols-12 text-center text-xs">
                                <div className="col-span-2 border-r border-black p-1 flex flex-col justify-center items-center text-center leading-snug">
                                    <div className="font-bold text-[11px]">Academic Year:</div>
                                    <div className="text-[11px]">{resolvedAy}</div>
                                    <div className="text-[11px]"><strong className="font-bold">Term:</strong> {resolvedTerm}</div>
                                </div>
                                <div className="col-span-8 p-1.5 flex items-center justify-center font-bold text-lg tracking-wider">
                                    {resolvedExamType}
                                </div>
                                <div className="col-span-2 border-l border-black p-1 flex flex-col justify-center items-center text-center leading-snug">
                                    <span className="text-[11px]">Record No.:</span>
                                    <strong className="font-bold text-[11px]">{resolvedRecordNo}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. Metadata Information */}
                        <div className="my-4 text-xs text-black leading-relaxed space-y-1.5">
                            <div className="grid grid-cols-12">
                                <div className="col-span-6">
                                    <strong>Department:</strong> {resolvedDept}
                                </div>
                                <div className="col-span-3">
                                    <strong>Class:</strong> {resolvedClass}
                                </div>
                                <div className="col-span-3">
                                    <strong>Div.:</strong> {resolvedDiv}
                                </div>
                            </div>
                            <div className="grid grid-cols-12">
                                <div className="col-span-6">
                                    <strong>Subject:</strong> {resolvedSubject}
                                </div>
                                <div className="col-span-3">
                                    <strong>Maximum Marks:</strong> {resolvedMarks}
                                </div>
                                <div className="col-span-3">
                                    <strong>Duration:</strong> {resolvedDuration}
                                </div>
                            </div>
                            <div className="grid grid-cols-12">
                                <div className="col-span-6">
                                    <strong>Subject Code:</strong> {resolvedCode}
                                </div>
                                <div className="col-span-3"></div>
                                <div className="col-span-3">
                                    <strong>Date:</strong> {resolvedDate}
                                </div>
                            </div>
                        </div>

                        {/* 3. Notes */}
                        <div className="my-4 text-xs italic leading-relaxed">
                            <p><strong>Note:</strong> {dynamicSolveNote}</p>
                            <p className="pl-8">2. Give explanation or justification wherever required.</p>
                        </div>

                        {/* 4. Course Outcomes Table (Editable) */}
                        <div className="my-4 pb-1">
                            <h4 className="text-xs font-bold mb-1">Course Outcomes:</h4>
                            <table className="w-full border-collapse border border-black text-xs" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="border-b border-black text-center font-bold bg-[#D9D9D9] print:bg-[#D9D9D9]">
                                        <th className="border-r border-black p-1 text-center" style={{ width: '12%' }}>CO</th>
                                        <th className="border-r border-black p-1 text-center" style={{ width: '73%' }}>Course Outcomes</th>
                                        <th className="p-1 text-center" style={{ width: '15%' }}>BT Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localCOs.map((item, idx) => (
                                        <tr key={`co-${idx}`} className="border-b border-black">
                                            <td className="border-r border-black p-1 text-center font-bold">
                                                {item.co}
                                            </td>
                                            <td className="border-r border-black p-1 pl-2">
                                                {isEditingMode ? (
                                                    <textarea
                                                        value={item.desc}
                                                        onChange={(e) => updateCO(idx, 'desc', e.target.value)}
                                                        rows={2}
                                                        className="w-full bg-amber-50/50 hover:bg-amber-50 focus:bg-white border border-dashed border-amber-400 focus:border-amber-600 rounded p-1 text-xs font-serif leading-relaxed text-black focus:outline-none print:border-none print:bg-transparent print:p-0 resize-y"
                                                        placeholder="Enter course outcome statement..."
                                                    />
                                                ) : (
                                                    <span>{item.desc}</span>
                                                )}
                                            </td>
                                            <td className="p-1 text-center">
                                                <div className="flex items-center justify-center">
                                                    {isEditingMode ? (
                                                        <input
                                                            type="text"
                                                            value={item.bt}
                                                            onChange={(e) => updateCO(idx, 'bt', e.target.value)}
                                                            className="w-full text-center bg-amber-50/50 hover:bg-amber-50 focus:bg-white border border-dashed border-amber-400 focus:border-amber-600 rounded p-1 text-xs font-serif font-bold text-black focus:outline-none print:border-none print:bg-transparent print:p-0"
                                                            placeholder="e.g. L2"
                                                        />
                                                    ) : (
                                                        <span className="font-bold">{item.bt}</span>
                                                    )}
                                                    {isEditingMode && localCOs.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCO(idx)}
                                                            className="no-print opacity-60 hover:opacity-100 text-red-600 p-0.5 ml-1 inline-flex"
                                                            title="Delete Course Outcome"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Add Course Outcome Action */}
                            {isEditingMode && (
                                <div className="no-print pt-1 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={addCO}
                                        className="text-[11px] text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded font-sans flex items-center gap-1 font-semibold transition-colors"
                                    >
                                        <Plus className="w-3 h-3" /> Add Course Outcome (CO)
                                    </button>
                                    <span className="text-[10px] text-slate-500 font-sans italic">
                                        Type directly into any Course Outcome or BT Level
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* 5. Questions Table (Page 1) */}
                        <div className="mt-4">
                            {renderQuestionTable(page1Items, 'p1')}
                        </div>
                    </div>

                    {/* Page 1 Footer */}
                    <div className="pt-6 flex justify-between items-center text-[10px] border-t border-transparent">
                        <div>Rev.: {resolvedRev} &nbsp;&nbsp;&nbsp;&nbsp; Date: {resolvedRevDate}</div>
                        <div className="font-bold">Page 1 of {totalPagesCount}</div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SUBSEQUENT PAGES (Pages 2 to N, dynamic distribution)                     */}
                {/* ========================================================================= */}
                {pages.slice(1).map((pageItems, pIdx) => {
                    const pageNum = pIdx + 2;
                    return (
                        <div
                            key={`page-${pageNum}`}
                            className="page-break pt-8 min-h-[1050px] print:min-h-0 print:h-auto flex flex-col justify-between border-t-2 border-dashed border-slate-300 print:border-none mt-8 print:mt-0 print:pt-4"
                        >
                            <div>
                                {/* Questions Table Continuation */}
                                {renderQuestionTable(pageItems, `p${pageNum}`)}
                            </div>

                            {/* Page Footer */}
                            <div className="pt-6 flex justify-between items-center text-[10px] border-t border-transparent">
                                <div>Rev.: {resolvedRev} &nbsp;&nbsp;&nbsp;&nbsp; Date: {resolvedRevDate}</div>
                                <div className="font-bold">Page {pageNum} of {totalPagesCount}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
