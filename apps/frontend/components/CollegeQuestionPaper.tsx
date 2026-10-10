'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Printer, RefreshCw, Edit3, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    courseOutcomes?: CourseOutcome[];
    editable?: boolean;
    onReplaceQuestion?: (secIdx: number, qIdx: number) => void;
    onEditQuestion?: (secIdx: number, qIdx: number, q: any) => void;
    onRemoveQuestion?: (secIdx: number, qIdx: number) => void;
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
    courseOutcomes,
    editable = false,
    onReplaceQuestion,
    onEditQuestion,
    onRemoveQuestion,
}: CollegeQuestionPaperProps) {
    const [isExportingDocx, setIsExportingDocx] = useState(false);

    // Resolve details from paper object if provided
    const resolvedSubject = paper?.title || paper?.subject || subjectName;
    const resolvedExamType = paper?.exam_type || paper?.content?.header?.exam_type || examType;
    const resolvedMarks = paper?.total_marks || paper?.totalMarks || maxMarks;
    const resolvedDuration = paper?.content?.header?.duration_minutes ? `${paper.content.header.duration_minutes} Min` : duration;
    const resolvedDate = paper?.date || date;
    const resolvedCode = paper?.content?.header?.subject_code || subjectCode;

    // Default COs if not supplied
    const defaultCOs: CourseOutcome[] = [
        { co: 'CO1', desc: 'Understand the fundamental concepts, architectures, and theoretical foundations.', bt: 'L2' },
        { co: 'CO2', desc: 'Apply core design techniques, models, and computational methodologies.', bt: 'L3' },
        { co: 'CO3', desc: 'Formulate, implement, and analyze optimized solutions for technical problem statements.', bt: 'L3' },
    ];
    const cos = courseOutcomes || defaultCOs;

    // Flatten or structure questions into PCCOER pattern:
    // Que 1 (A, B, C) -> OR -> Que 2 (A, B, C) -> Page Break -> Que 3 (A, B, C) -> OR -> Que 4 (A, B, C)
    const structuredQuestions: Array<{
        type: 'QUESTION' | 'OR';
        queNum?: number;
        sub?: string;
        text?: string;
        marks_co_btl?: string;
        pi?: string;
        raw?: any;
        secIdx?: number;
        qIdx?: number;
    }> = [];

    if (paper?.sections && paper.sections.length > 0) {
        let currentQueNum = 1;
        paper.sections.forEach((sec: any, secIdx: number) => {
            const secQs = sec.questions || [];
            secQs.forEach((q: any, qIdx: number) => {
                const subLetter = String.fromCharCode(65 + (qIdx % 3));
                const btl = q.blooms_level ? q.blooms_level.split('_')[0] : 'L2';
                const coVal = q.co || `CO${(secIdx % 3) + 1}`;
                const marksVal = q.marks || sec.marksPerQuestion || 5;

                structuredQuestions.push({
                    type: 'QUESTION',
                    queNum: currentQueNum,
                    sub: subLetter,
                    text: q.text,
                    marks_co_btl: `${marksVal} / ${coVal} / ${btl}`,
                    pi: q.pi || '1.1.1',
                    raw: q,
                    secIdx,
                    qIdx,
                });

                // Insert OR separator every 3 questions or between choice pairs
                if ((qIdx + 1) % 3 === 0 && (qIdx + 1) < secQs.length) {
                    structuredQuestions.push({ type: 'OR' });
                    currentQueNum += 1;
                }
            });

            if (secIdx < paper.sections.length - 1) {
                structuredQuestions.push({ type: 'OR' });
                currentQueNum += 1;
            }
        });
    } else {
        // Fallback default sample questions matching the exact format
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
        sampleList.forEach(item => {
            if (item.type === 'OR') {
                structuredQuestions.push({ type: 'OR' });
            } else {
                structuredQuestions.push({
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

    // Split questions for Page 1 (Q1, OR, Q2) and Page 2 (Q3, OR, Q4)
    const page1Items = structuredQuestions.filter(q => q.type === 'OR' ? true : (q.queNum && q.queNum <= 2));
    const page2Items = structuredQuestions.filter(q => q.type === 'OR' ? false : (q.queNum && q.queNum > 2));
    // Re-inject the second OR if exists
    const finalPage2Items: typeof structuredQuestions = [];
    page2Items.forEach((item, idx) => {
        finalPage2Items.push(item);
        if (item.queNum === 3 && item.sub === 'C' && page2Items.some(x => x.queNum === 4)) {
            finalPage2Items.push({ type: 'OR' });
        }
    });

    const handleDownloadDocx = async () => {
        setIsExportingDocx(true);
        try {
            const payload = {
                department,
                subject: resolvedSubject,
                subject_code: resolvedCode,
                class: studentClass,
                div,
                academic_year: academicYear,
                term,
                exam_type: resolvedExamType,
                max_marks: resolvedMarks,
                duration: resolvedDuration,
                date: resolvedDate,
                record_no: recordNo,
                rev,
                rev_date: revDate,
                co_list: cos,
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

    return (
        <div className="space-y-4">
            {/* Top Toolbar Actions */}
            <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-2 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-white">Official Format:</span>
                    <span>PCET PCCOER Ravet Autonomous Exam Standard (ACAD/R/11)</span>
                </div>

                <div className="flex items-center space-x-2">
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

            {/* A4 Paper Sheet Container */}
            <div className="pccoer-paper-container mx-auto bg-white text-black font-serif shadow-2xl rounded-sm print:shadow-none print:rounded-none max-w-[850px] p-6 sm:p-10 select-text"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}>

                {/* ========================================================================= */}
                {/* PAGE 1                                                                    */}
                {/* ========================================================================= */}
                <div className="min-h-[1050px] flex flex-col justify-between">
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
                                    <h4 className="text-[13px] font-bold tracking-tight">Pimpri Chinchwad Education Trust&apos;s</h4>
                                    <h2 className="text-[15px] font-bold tracking-normal leading-tight pt-0.5">
                                        Pimpri Chinchwad College of Engineering & Research Ravet, Pune
                                    </h2>
                                    <p className="text-[10px] leading-tight pt-1 text-black">
                                        An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified
                                    </p>
                                    <h5 className="text-[12px] font-bold pt-0.5">IQAC PCCOER</h5>
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
                                <div className="col-span-3 border-r border-black p-1.5 flex flex-col justify-center text-left pl-3">
                                    <div><strong className="font-bold">Academic Year:</strong> 2025 – 26</div>
                                    <div><strong className="font-bold">Term:</strong> {term}</div>
                                </div>
                                <div className="col-span-6 p-1.5 flex items-center justify-center font-bold text-lg tracking-wider">
                                    {resolvedExamType}
                                </div>
                                <div className="col-span-3 border-l border-black p-1.5 flex flex-col justify-center text-left pl-3">
                                    <span className="text-[11px]">Record No.:</span>
                                    <strong className="font-bold text-xs">{recordNo}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. Metadata Information */}
                        <div className="py-2.5 text-xs text-black leading-relaxed space-y-1">
                            <div className="grid grid-cols-12">
                                <div className="col-span-6">
                                    <strong>Department:</strong> {department}
                                </div>
                                <div className="col-span-3">
                                    <strong>Class:</strong> {studentClass}
                                </div>
                                <div className="col-span-3">
                                    <strong>Div.:</strong> {div}
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
                        <div className="text-xs italic py-1 leading-snug">
                            <p><strong>Note:</strong> 1. Solve Que.1 or Que.2 and Que.3 or Que.4.</p>
                            <p className="pl-8">2. Give explanation or justification wherever required.</p>
                        </div>

                        {/* 4. Course Outcomes Table */}
                        <div className="pt-2 pb-3">
                            <h4 className="text-xs font-bold mb-1">Course Outcomes:</h4>
                            <table className="w-full border-collapse border border-black text-xs">
                                <thead>
                                    <tr className="border-b border-black text-center font-bold">
                                        <th className="border-r border-black p-1 w-16 text-center">CO</th>
                                        <th className="border-r border-black p-1 text-center">Course Outcomes</th>
                                        <th className="p-1 w-24 text-center">BT Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cos.map((item, idx) => (
                                        <tr key={idx} className="border-b border-black">
                                            <td className="border-r border-black p-1 text-center font-bold">{item.co}</td>
                                            <td className="border-r border-black p-1 pl-2">{item.desc}</td>
                                            <td className="p-1 text-center">{item.bt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* 5. Questions Table (Page 1) */}
                        <div className="pt-1">
                            <table className="w-full border-collapse border border-black text-xs">
                                <thead>
                                    <tr className="border-b border-black text-center font-bold">
                                        <th className="border-r border-black p-1 w-10 text-center">Que</th>
                                        <th className="border-r border-black p-1 w-12 text-center">Sub Que.</th>
                                        <th className="border-r border-black p-1 text-center">Questions</th>
                                        <th className="border-r border-black p-1 w-24 text-center">Marks/ CO/BTL</th>
                                        <th className="p-1 w-12 text-center">PI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {page1Items.map((q, idx) => {
                                        if (q.type === 'OR') {
                                            return (
                                                <tr key={`or-${idx}`} className="border-b border-black bg-slate-50 print:bg-transparent">
                                                    <td colSpan={5} className="p-1 text-center font-bold tracking-widest text-sm">
                                                        OR
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={`q-${idx}`} className="border-b border-black align-top group">
                                                <td className="border-r border-black p-1.5 text-center font-bold">
                                                    {q.sub === 'A' ? q.queNum : ''}
                                                </td>
                                                <td className="border-r border-black p-1.5 text-center font-bold">
                                                    {q.sub}
                                                </td>
                                                <td className="border-r border-black p-1.5 leading-relaxed relative">
                                                    <div>{q.text}</div>
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
                                                <td className="border-r border-black p-1.5 text-center whitespace-nowrap">
                                                    {q.marks_co_btl}
                                                </td>
                                                <td className="p-1.5 text-center">
                                                    {q.pi}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Page 1 Footer */}
                    <div className="pt-6 flex justify-between items-center text-[10px] border-t border-transparent">
                        <div>Rev.: {rev} &nbsp;&nbsp;&nbsp;&nbsp; Date: {revDate}</div>
                        <div className="font-bold">Page 1 of 2</div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* PAGE 2                                                                    */}
                {/* ========================================================================= */}
                <div className="page-break pt-8 min-h-[1050px] flex flex-col justify-between border-t-2 border-dashed border-slate-300 print:border-none mt-8 print:mt-0 print:pt-0">
                    <div>
                        {/* Questions Table (Page 2 Continuation: Que 3 & Que 4) */}
                        <table className="w-full border-collapse border border-black text-xs">
                            <thead>
                                <tr className="border-b border-black text-center font-bold">
                                    <th className="border-r border-black p-1 w-10 text-center">Que</th>
                                    <th className="border-r border-black p-1 w-12 text-center">Sub Que.</th>
                                    <th className="border-r border-black p-1 text-center">Questions</th>
                                    <th className="border-r border-black p-1 w-24 text-center">Marks/ CO/BTL</th>
                                    <th className="p-1 w-12 text-center">PI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalPage2Items.map((q, idx) => {
                                    if (q.type === 'OR') {
                                        return (
                                            <tr key={`or2-${idx}`} className="border-b border-black bg-slate-50 print:bg-transparent">
                                                <td colSpan={5} className="p-1 text-center font-bold tracking-widest text-sm">
                                                    OR
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return (
                                        <tr key={`q2-${idx}`} className="border-b border-black align-top group">
                                            <td className="border-r border-black p-1.5 text-center font-bold">
                                                {q.sub === 'A' ? q.queNum : ''}
                                            </td>
                                            <td className="border-r border-black p-1.5 text-center font-bold">
                                                {q.sub}
                                            </td>
                                            <td className="border-r border-black p-1.5 leading-relaxed relative">
                                                <div>{q.text}</div>
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
                                            <td className="border-r border-black p-1.5 text-center whitespace-nowrap">
                                                {q.marks_co_btl}
                                            </td>
                                            <td className="p-1.5 text-center">
                                                {q.pi}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Page 2 Footer */}
                    <div className="pt-6 flex justify-between items-center text-[10px] border-t border-transparent">
                        <div>Rev.: {rev} &nbsp;&nbsp;&nbsp;&nbsp; Date: {revDate}</div>
                        <div className="font-bold">Page 2 of 2</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
