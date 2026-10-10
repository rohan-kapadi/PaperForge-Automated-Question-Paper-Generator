'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Calendar, Clock, Sparkles, Printer, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RealPaper {
    id: string;
    title: string;
    exam_type?: string;
    set_name?: string;
    status?: string;
    total_marks?: number;
    totalMarks?: number;
    date?: string;
    created_at?: string;
    sections?: any[];
    content?: any;
}

export default function GeneratedPapersPage() {
    const [papers, setPapers] = useState<RealPaper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewPaper, setPreviewPaper] = useState<RealPaper | null>(null);

    const fetchPapers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/papers`);
            if (res.ok) {
                const data = await res.json();
                setPapers(data || []);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || `Failed to fetch generated papers (${res.status})`);
                setPapers([]);
            }
        } catch (err: any) {
            console.error('Fetch papers error:', err);
            setError('Unable to connect to backend server. Please verify the service is running.');
            setPapers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []);

    const printCurrentPaper = () => {
        window.print();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-amber-400" />
                        Generated Papers Archive
                    </h2>
                    <p className="text-slate-400 text-sm">Access, preview, print, and export examination papers saved in the database.</p>
                </div>
                <Link href="/dashboard/generate">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20">
                        <Sparkles className="w-4 h-4 mr-2" /> Generate New Paper
                    </Button>
                </Link>
            </div>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm">Loading papers archive...</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-rose-500/20 rounded-2xl text-center p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Failed to Load Papers</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
                    </div>
                    <Button
                        onClick={fetchPapers}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                    >
                        Retry
                    </Button>
                </div>
            )}

            {!isLoading && !error && papers.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
                    <p className="text-slate-400">No examination papers generated yet.</p>
                    <Link href="/dashboard/generate" className="mt-3 inline-block">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            Generate First Paper
                        </Button>
                    </Link>
                </div>
            )}

            {!isLoading && !error && papers.length > 0 && (
                <div className="space-y-4">
                    {papers.map((paper) => (
                        <div
                            key={paper.id}
                            className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm hover:shadow-xl"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 group-hover:bg-slate-700 transition-colors">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                                        {paper.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                                        <span className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {paper.date || (paper.created_at ? new Date(paper.created_at).toLocaleDateString() : 'Recent')}
                                        </span>
                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono font-medium">
                                            {paper.total_marks || paper.totalMarks || 50} Marks
                                        </span>
                                        {paper.set_name && (
                                            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-mono">
                                                {paper.set_name}
                                            </span>
                                        )}
                                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[11px]">
                                            {paper.status || 'Generated'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 w-full md:w-auto mt-2 md:mt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewPaper(paper)}
                                    className="bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                >
                                    <Eye className="w-4 h-4 mr-1.5" /> Preview
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setPreviewPaper(paper);
                                        setTimeout(() => window.print(), 300);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20"
                                >
                                    <Printer className="w-4 h-4 mr-1.5" /> Print / Export
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Preview Modal */}
            <AnimatePresence>
                {previewPaper && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{previewPaper.title}</h3>
                                        <p className="text-xs text-slate-400">
                                            Total Marks: {previewPaper.total_marks || previewPaper.totalMarks || 50} • Status: {previewPaper.status || 'Generated'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewPaper(null)} className="text-slate-400 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Paper Preview Render */}
                            <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-800 p-8 rounded-xl space-y-6 text-slate-200">
                                <div className="text-center border-b border-slate-800 pb-4 space-y-1">
                                    <h4 className="font-bold text-base text-white uppercase tracking-wider">Department of Computer Engineering</h4>
                                    <p className="text-xs text-slate-400">Autonomous Examination Question Paper</p>
                                    <p className="text-amber-400 font-semibold text-sm">{previewPaper.title}</p>
                                    <div className="flex justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                                        <span>Duration: {previewPaper.content?.header?.duration_minutes || 90} Minutes</span>
                                        <span>Max Marks: {previewPaper.total_marks || previewPaper.totalMarks || 50}</span>
                                        <span>Set: {previewPaper.set_name || previewPaper.content?.header?.set_name || 'Set A'}</span>
                                    </div>
                                </div>

                                {/* Instructions */}
                                {previewPaper.content?.header?.instructions && (
                                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-1">
                                        <p className="font-semibold text-amber-400">Instructions:</p>
                                        <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                                            {previewPaper.content.header.instructions.map((ins: string, idx: number) => (
                                                <li key={idx}>{ins}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Sections with questions */}
                                <div className="space-y-6">
                                    {previewPaper.sections && previewPaper.sections.length > 0 ? (
                                        previewPaper.sections.map((sec: any, sIdx: number) => (
                                            <div key={sec.id || sIdx} className="space-y-3">
                                                <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                                                    <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
                                                        {sec.name} ({sec.marksPerQuestion} Marks each)
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">
                                                        Total: {sec.totalMarks || (sec.marksPerQuestion * sec.questions.length)} M
                                                    </span>
                                                </div>
                                                <div className="space-y-2.5">
                                                    {sec.questions.map((q: any, qIdx: number) => (
                                                        <div key={q.id || qIdx} className="flex justify-between items-start gap-4 text-xs">
                                                            <div className="space-y-1 flex-1">
                                                                <p className="text-slate-200 leading-relaxed">
                                                                    <strong className="text-slate-400 mr-2">Q{qIdx + 1}.</strong>
                                                                    {q.text}
                                                                </p>
                                                                <div className="flex gap-2 text-[10px] text-slate-500">
                                                                    {q.blooms_level && <span>Bloom: {q.blooms_level.replace('_', ' ')}</span>}
                                                                    {q.unit && <span>• {q.unit}</span>}
                                                                    {q.co && <span>• {q.co}</span>}
                                                                </div>
                                                            </div>
                                                            <span className="font-mono text-amber-400 font-bold whitespace-nowrap">
                                                                [{q.marks || sec.marksPerQuestion} M]
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="space-y-4 text-xs">
                                            <div>
                                                <p className="font-bold text-white uppercase text-xs mb-2">Section A - Core Concepts</p>
                                                <p className="text-slate-300">1. Explain the primary architecture and functional layers of the database system. [5M]</p>
                                                <p className="text-slate-300 mt-2">2. Differentiate between physical and logical data independence with an example. [5M]</p>
                                            </div>
                                            <div className="pt-2 border-t border-slate-800/60">
                                                <p className="font-bold text-white uppercase text-xs mb-2">Section B - Comprehensive Problems</p>
                                                <p className="text-slate-300">3. Construct an ER diagram representing the university examination cell workflow. [10M]</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <Button variant="ghost" onClick={() => setPreviewPaper(null)} className="text-slate-400">
                                    Close Preview
                                </Button>
                                <Button onClick={printCurrentPaper} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    <Printer className="w-4 h-4 mr-2" /> Print Paper
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
