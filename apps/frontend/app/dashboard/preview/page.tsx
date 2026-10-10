'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CollegeQuestionPaper from '@/components/CollegeQuestionPaper';

export default function PaperFormatPreviewPage() {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header Toolbar */}
            <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
                <div>
                    <div className="flex items-center space-x-2">
                        <Link href="/dashboard/generated">
                            <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-white pl-0 pr-2">
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back
                            </Button>
                        </Link>
                        <span className="text-slate-600">/</span>
                        <span className="text-amber-400 font-semibold text-xs tracking-wider uppercase">Live Examination Layout</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                        <span>PCCOER Official Question Paper Format</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans font-normal">
                            Active Template
                        </span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Pimpri Chinchwad College of Engineering &amp; Research Ravet, Pune • Standard Format (ACAD/R/11)
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <Link href="/dashboard/generate">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs h-9 shadow-lg shadow-amber-500/20">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate Exam Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Official Paper Render Container */}
            <div className="rounded-2xl p-2 md:p-6 bg-slate-900/30 border border-slate-800/80 shadow-2xl backdrop-blur-sm">
                <CollegeQuestionPaper
                    department="Computer Engineering"
                    subjectName="Database Management Systems"
                    subjectCode="CS301PC"
                    className="TE"
                    div="A, B, C, D, E, F"
                    academicYear="2025 – 26"
                    term="II"
                    examType="UNIT TEST"
                    maxMarks={30}
                    duration="60 Min"
                    date="01-09-2025"
                    recordNo="ACAD/R/11"
                    rev="00"
                    revDate="01-09-2025"
                    editable={false}
                />
            </div>
        </div>
    );
}
