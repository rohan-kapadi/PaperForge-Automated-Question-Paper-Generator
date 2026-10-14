'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    Printer,
    Download,
    Eye,
    FileText,
    User,
    Calendar,
    BookOpen,
    Loader2,
    RefreshCw,
    Check,
    Clock,
    AlertCircle,
    Filter,
    ChevronDown,
    ChevronUp,
    Send,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import CollegeQuestionPaper from '@/components/CollegeQuestionPaper';

interface Paper {
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
    moderation_comments?: string;
    moderated_at?: string;
    submitted_by?: string;
    submitted_by_name?: string;
    print_status?: 'not_printed' | 'in_queue' | 'printed';
    printed_at?: string;
    subject?: string;
}

type FilterType = 'all' | 'not_printed' | 'in_queue' | 'printed';

const printStatusConfig = {
    not_printed: { label: 'Ready to Print', color: 'text-slate-400', bg: 'bg-slate-800', border: 'border-slate-700' },
    in_queue: { label: 'In Print Queue', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    printed: { label: 'Printed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
};

function ExamSectionDashboardContent() {
    const { isExamSection, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlFilter = searchParams.get('filter') as FilterType | null;

    const [papers, setPapers] = useState<Paper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>(urlFilter && ['all', 'not_printed', 'in_queue', 'printed'].includes(urlFilter) ? urlFilter : 'all');
    const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [printStatusMap, setPrintStatusMap] = useState<Record<string, 'not_printed' | 'in_queue' | 'printed'>>({});

    // Load local print statuses from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('examgen_print_status_map');
                if (saved) setPrintStatusMap(JSON.parse(saved));
            } catch {
                // ignore
            }
        }
    }, []);

    // Sync filter from URL
    useEffect(() => {
        if (urlFilter && ['all', 'not_printed', 'in_queue', 'printed'].includes(urlFilter)) {
            setFilter(urlFilter);
        }
    }, [urlFilter]);

    // Guard: only ExamSection can access this page
    useEffect(() => {
        if (!authLoading && !isExamSection) {
            router.replace('/dashboard');
        }
    }, [authLoading, isExamSection, router]);

    const fetchPapers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/papers');
            if (res.ok) {
                const data = await res.json();
                const list: Paper[] = Array.isArray(data) ? data : (data.papers || data.data || []);
                // Only papers approved by HOD
                const approved = list.filter(p => (p.status || '').toLowerCase() === 'approved');
                setPapers(approved);
            } else {
                setError('Failed to fetch papers from server.');
            }
        } catch (err) {
            setError('Could not connect to the backend server.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isExamSection) {
            fetchPapers();
        }
    }, [authLoading, isExamSection]);

    const updatePrintStatus = (paperId: string, newStatus: 'not_printed' | 'in_queue' | 'printed') => {
        const nextMap = { ...printStatusMap, [paperId]: newStatus };
        setPrintStatusMap(nextMap);
        if (typeof window !== 'undefined') {
            localStorage.setItem('examgen_print_status_map', JSON.stringify(nextMap));
        }
    };

    const handleDownload = async (paper: Paper) => {
        setDownloadingId(paper.id);
        try {
            // First try direct backend docx export
            const res = await apiFetch(`/papers/${paper.id}/export/docx`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(paper.title || 'Question_Paper').replace(/\s+/g, '_')}_Approved.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                return;
            }

            // Fallback: python parser export
            const payload = {
                department: paper.content?.header?.department || 'Computer Engineering',
                subject: paper.title,
                sections: paper.sections || paper.content?.sections || [],
                ...paper.content,
            };

            const pyRes = await fetch('http://localhost:8000/export-pccoer-docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (pyRes.ok) {
                const blob = await pyRes.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(paper.title || 'Question_Paper').replace(/\s+/g, '_')}_Approved.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download paper.');
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // Calculate effective papers with print status
    const papersWithPrintStatus = papers.map(p => ({
        ...p,
        print_status: printStatusMap[p.id] || p.print_status || 'not_printed',
    }));

    const filteredPapers = filter === 'all'
        ? papersWithPrintStatus
        : papersWithPrintStatus.filter(p => p.print_status === filter);

    const counts = {
        all: papersWithPrintStatus.length,
        not_printed: papersWithPrintStatus.filter(p => p.print_status === 'not_printed').length,
        in_queue: papersWithPrintStatus.filter(p => p.print_status === 'in_queue').length,
        printed: papersWithPrintStatus.filter(p => p.print_status === 'printed').length,
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Exam Section Dashboard</h2>
                    <p className="text-slate-400 mt-1 text-sm">
                        Access HOD-approved question papers for final printing and distribution
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPapers}
                    disabled={isLoading}
                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                    { key: 'all', label: 'Approved Papers', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                    { key: 'not_printed', label: 'Ready to Print', icon: FileText, color: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' },
                    { key: 'in_queue', label: 'In Print Queue', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    { key: 'printed', label: 'Printed', icon: Printer, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                ] as const).map(({ key, label, icon: Icon, color, bg, border }) => {
                    const isSelected = filter === key;
                    return (
                        <motion.div
                            key={key}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setFilter(key)}
                            className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                isSelected ? `${bg} ${border} ring-1 ring-inset ${border}` : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                                    <p className={`text-2xl font-bold mt-1 ${isSelected ? color : 'text-white'}`}>
                                        {isLoading ? '—' : counts[key]}
                                    </p>
                                </div>
                                <div className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-900/30 border border-slate-800/80 p-2 rounded-xl">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 px-2">
                    <Filter className="w-3.5 h-3.5 text-slate-500" /> Filter View:
                </span>
                {(['all', 'not_printed', 'in_queue', 'printed'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            filter === f
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        {f === 'all' ? 'All Approved' : f === 'not_printed' ? 'Ready to Print' : f === 'in_queue' ? 'In Queue' : 'Printed'}
                        <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 bg-slate-800 rounded-full border border-slate-700">
                            {counts[f]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Papers List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
            ) : filteredPapers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">No Approved Papers Found</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                        {filter === 'all'
                            ? 'No question papers have been approved by the HOD yet. Once approved, they will immediately appear here.'
                            : `No papers match the current filter (${filter.replace('_', ' ')}).`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredPapers.map((paper) => {
                            const printStatus = paper.print_status || 'not_printed';
                            const psCfg = printStatusConfig[printStatus];

                            return (
                                <motion.div
                                    key={paper.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex items-center gap-4 p-4">
                                        {/* Status Badge Icon */}
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/30 flex items-center justify-center shrink-0">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        </div>

                                        {/* Paper Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-white truncate">{paper.title}</h3>
                                                {paper.exam_type && (
                                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                                                        {paper.exam_type}
                                                    </Badge>
                                                )}
                                                <Badge className={`text-[10px] border ${psCfg.bg} ${psCfg.color} ${psCfg.border}`}>
                                                    {psCfg.label}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                                                {(paper.total_marks || paper.totalMarks) && (
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="w-3.5 h-3.5 text-slate-500" /> {paper.total_marks || paper.totalMarks} marks
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Approved {formatDate(paper.moderated_at || paper.created_at)}
                                                </span>
                                            </div>
                                            {paper.moderation_comments && (
                                                <p className="mt-1.5 text-xs text-emerald-300/80 italic">
                                                    HOD Comment: &quot;{paper.moderation_comments}&quot;
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                            {/* Preview toggle */}
                                            <button
                                                onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                                title="Preview question paper"
                                            >
                                                {expandedPaper === paper.id ? (
                                                    <><ChevronUp className="w-4 h-4" /> Close</>
                                                ) : (
                                                    <><Eye className="w-4 h-4" /> Preview</>
                                                )}
                                            </button>

                                            {/* Download Word Document */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(paper)}
                                                disabled={downloadingId === paper.id}
                                                className="border-slate-700 text-slate-300 hover:text-blue-400 hover:bg-slate-800 text-xs h-8"
                                                title="Download PCCOER Format Word Document"
                                            >
                                                {downloadingId === paper.id ? (
                                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                                ) : (
                                                    <Download className="w-3.5 h-3.5 mr-1" />
                                                )}
                                                DOCX
                                            </Button>

                                            {/* Print Workflow Transitions */}
                                            {printStatus === 'not_printed' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updatePrintStatus(paper.id, 'in_queue')}
                                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs h-8"
                                                >
                                                    <Send className="w-3.5 h-3.5 mr-1" /> Send to Queue
                                                </Button>
                                            )}
                                            {printStatus === 'in_queue' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => updatePrintStatus(paper.id, 'printed')}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8"
                                                >
                                                    <Printer className="w-3.5 h-3.5 mr-1" /> Mark Printed
                                                </Button>
                                            )}
                                            {printStatus === 'printed' && (
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg font-medium">
                                                    <Check className="w-3.5 h-3.5" /> Printed
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Inline Question Paper Preview */}
                                    <AnimatePresence>
                                        {expandedPaper === paper.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-800 overflow-hidden"
                                            >
                                                <div className="p-4 sm:p-6 bg-slate-950/70 overflow-x-auto">
                                                    <CollegeQuestionPaper
                                                        paper={paper}
                                                        editable={false}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default function ExamSectionDashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
        }>
            <ExamSectionDashboardContent />
        </Suspense>
    );
}
