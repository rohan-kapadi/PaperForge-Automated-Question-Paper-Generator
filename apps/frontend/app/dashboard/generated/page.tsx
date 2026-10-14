'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    FileText,
    Download,
    Eye,
    Calendar,
    Clock,
    Sparkles,
    Printer,
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Send,
    Check,
    XCircle,
    RotateCcw,
    MessageSquare,
    ShieldAlert,
    Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CollegeQuestionPaper from '@/components/CollegeQuestionPaper';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
    moderation_comments?: string;
    moderated_at?: string;
}

export default function GeneratedPapersPage() {
    const { user, role, isHODOrAdmin } = useAuth();
    const [papers, setPapers] = useState<RealPaper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [previewPaper, setPreviewPaper] = useState<RealPaper | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'review' | 'approved' | 'rejected'>('all');
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    // Moderation Comments / Decision Modal
    const [moderationModal, setModerationModal] = useState<{
        isOpen: boolean;
        paper: RealPaper | null;
        action: 'Approve' | 'Reject';
        comments: string;
        isSubmitting: boolean;
    }>({
        isOpen: false,
        paper: null,
        action: 'Approve',
        comments: '',
        isSubmitting: false,
    });

    const [institutionSettings, setInstitutionSettings] = useState<any>(null);

    const fetchPapers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await apiFetch('/papers');
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

    const fetchSettings = async () => {
        try {
            const res = await apiFetch('/settings');
            if (res.ok) {
                const data = await res.json();
                setInstitutionSettings(data);
            }
        } catch (err) {
            console.warn('Could not fetch institution settings for preview:', err);
        }
    };

    useEffect(() => {
        fetchPapers();
        fetchSettings();
    }, []);

    const handleStatusTransition = async (paperId: string, targetStatus: string, comments?: string) => {
        setActionInProgress(paperId);
        try {
            const body: any = { status: targetStatus };
            if (comments !== undefined) {
                body.moderation_comments = comments;
            }
            if (user?.id) {
                body.user_id = user.id;
            }

            const res = await apiFetch(`/papers/${paperId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const updated = await res.json();
                setPapers(prev => prev.map(p => (p.id === paperId ? { ...p, ...updated } : p)));
                if (previewPaper?.id === paperId) {
                    setPreviewPaper(prev => (prev ? { ...prev, ...updated } : null));
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(errData.message || `Failed to transition status to ${targetStatus}`);
            }
        } catch (err: any) {
            alert(err.message || 'Status transition request failed');
        } finally {
            setActionInProgress(null);
        }
    };

    const handleConfirmModeration = async () => {
        if (!moderationModal.paper) return;
        setModerationModal(prev => ({ ...prev, isSubmitting: true }));
        try {
            const targetStatus = moderationModal.action === 'Approve' ? 'Approved' : 'Rejected';
            await handleStatusTransition(
                moderationModal.paper.id,
                targetStatus,
                moderationModal.comments
            );
            setModerationModal({ isOpen: false, paper: null, action: 'Approve', comments: '', isSubmitting: false });
        } finally {
            setModerationModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    const handleExportWord = async (paper: RealPaper) => {
        try {
            const header = (paper as any).content?.header || {};
            const payload = {
                department: header.department || 'Computer Engineering',
                subject: header.subject_name || paper.title || 'Examination Paper',
                subject_code: header.subject_code || 'CS301PC',
                class: header.student_class || 'SE',
                div: header.div || 'A, B, C, D, E, F',
                academic_year: header.academic_year || '2025 – 26',
                term: header.term || 'II',
                exam_type: header.exam_type_display || paper.exam_type || 'UNIT TEST',
                max_marks: paper.total_marks || paper.totalMarks || 30,
                duration: header.duration || `${header.duration_minutes || 60} Min`,
                date: header.exam_date || '',
                record_no: header.record_no || 'ACAD/R/11',
                rev: header.rev || '00',
                rev_date: header.rev_date || '01-09-2025',
                co_list: header.course_outcomes || [],
                sections: (paper as any).content?.sections || paper.sections || [],
            };
            const res = await apiFetch('/papers/export/docx', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(paper.title || 'Paper').replace(/\s+/g, '_')}_PCCOER.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Failed to download Word document. Please ensure backend services are running.');
        }
    };

    // Filtered list
    const filteredPapers = papers.filter(p => {
        const s = p.status || 'Generated';
        if (statusFilter === 'draft') return s === 'Draft' || s === 'Generated';
        if (statusFilter === 'review') return s === 'Submitted_For_Review';
        if (statusFilter === 'approved') return s === 'Approved';
        if (statusFilter === 'rejected') return s === 'Rejected';
        return true;
    });

    const countAll = papers.length;
    const countDraft = papers.filter(p => (p.status || 'Generated') === 'Draft' || (p.status || 'Generated') === 'Generated').length;
    const countReview = papers.filter(p => p.status === 'Submitted_For_Review').length;
    const countApproved = papers.filter(p => p.status === 'Approved').length;
    const countRejected = papers.filter(p => p.status === 'Rejected').length;

    const renderStatusBadge = (status?: string) => {
        const s = status || 'Generated';
        switch (s) {
            case 'Approved':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                    </Badge>
                );
            case 'Submitted_For_Review':
                return (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Under Review
                    </Badge>
                );
            case 'Rejected':
                return (
                    <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[11px] font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Rejected
                    </Badge>
                );
            case 'Draft':
                return (
                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[11px] font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Draft
                    </Badge>
                );
            case 'Generated':
            default:
                return (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[11px] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Generated
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-amber-400" />
                        Generated Papers & Moderation
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Manage autonomous college question papers, submit for departmental approval, and moderate papers.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/generate">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20">
                            <Sparkles className="w-4 h-4 mr-2" /> Generate New Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Workflow Filter Strip */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 no-print">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                    All Papers
                    <Badge className={`text-[10px] ${statusFilter === 'all' ? 'bg-slate-950/20 text-slate-900 border-none' : 'bg-slate-800 text-slate-300'}`}>
                        {countAll}
                    </Badge>
                </button>
                <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'draft'
                            ? 'bg-blue-500 text-white shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                    Draft / Generated
                    <Badge className={`text-[10px] ${statusFilter === 'draft' ? 'bg-white/20 text-white border-none' : 'bg-slate-800 text-slate-300'}`}>
                        {countDraft}
                    </Badge>
                </button>
                <button
                    onClick={() => setStatusFilter('review')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'review'
                            ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                    Awaiting Moderation
                    <Badge className={`text-[10px] ${statusFilter === 'review' ? 'bg-slate-950/20 text-slate-900 border-none' : 'bg-amber-500/20 text-amber-300 border-none'}`}>
                        {countReview}
                    </Badge>
                </button>
                <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'approved'
                            ? 'bg-emerald-600 text-white shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                    Approved
                    <Badge className={`text-[10px] ${statusFilter === 'approved' ? 'bg-white/20 text-white border-none' : 'bg-slate-800 text-slate-300'}`}>
                        {countApproved}
                    </Badge>
                </button>
                <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                        statusFilter === 'rejected'
                            ? 'bg-rose-600 text-white shadow-md font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                >
                    Rejected
                    <Badge className={`text-[10px] ${statusFilter === 'rejected' ? 'bg-white/20 text-white border-none' : 'bg-slate-800 text-slate-300'}`}>
                        {countRejected}
                    </Badge>
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl no-print">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                    <p className="text-slate-400 text-sm">Loading papers archive...</p>
                </div>
            )}

            {/* Error */}
            {!isLoading && error && (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-rose-500/20 rounded-2xl text-center p-6 space-y-4 no-print">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Failed to Load Papers</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
                    </div>
                    <Button onClick={fetchPapers} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                        Retry
                    </Button>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && filteredPapers.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl no-print">
                    <p className="text-slate-400">
                        {statusFilter === 'all'
                            ? 'No examination papers generated yet.'
                            : `No examination papers matching filter "${statusFilter}".`}
                    </p>
                    <Link href="/dashboard/generate" className="mt-3 inline-block">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            Generate Examination Paper
                        </Button>
                    </Link>
                </div>
            )}

            {/* Papers List */}
            {!isLoading && !error && filteredPapers.length > 0 && (
                <div className="space-y-4 no-print">
                    {filteredPapers.map((paper) => {
                        const status = paper.status || 'Generated';
                        const isWorking = actionInProgress === paper.id;

                        return (
                            <div
                                key={paper.id}
                                className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm hover:shadow-xl"
                            >
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 group-hover:bg-slate-700 transition-colors shrink-0 mt-0.5">
                                        <FileText className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                                                {paper.title}
                                            </h3>
                                            {paper.set_name && (
                                                <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] font-mono">
                                                    {paper.set_name}
                                                </Badge>
                                            )}
                                            {renderStatusBadge(paper.status)}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {paper.date || (paper.created_at ? new Date(paper.created_at).toLocaleDateString() : 'Recent')}
                                            </span>
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-mono font-medium">
                                                {paper.total_marks || paper.totalMarks || 50} Marks
                                            </span>
                                            {paper.exam_type && (
                                                <span className="text-slate-400 font-medium">
                                                    {paper.exam_type}
                                                </span>
                                            )}
                                        </div>

                                        {/* Moderation Feedback Message (if rejected) */}
                                        {status === 'Rejected' && paper.moderation_comments && (
                                            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
                                                <MessageSquare className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                                                <div>
                                                    <span className="font-bold text-rose-200">HOD Feedback: </span>
                                                    <span>{paper.moderation_comments}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contextual Action Buttons based on Status */}
                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0 justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewPaper(paper)}
                                        className="bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
                                    >
                                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                                    </Button>

                                    {/* Action 1: If Draft or Generated -> Submit for Review */}
                                    {(status === 'Generated' || status === 'Draft') && (
                                        <Button
                                            size="sm"
                                            disabled={isWorking}
                                            onClick={() => handleStatusTransition(paper.id, 'Submitted_For_Review')}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                                        >
                                            {isWorking ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                            ) : (
                                                <Send className="w-3.5 h-3.5 mr-1.5" />
                                            )}
                                            Submit for Review
                                        </Button>
                                    )}

                                    {/* Action 2: If Submitted_For_Review */}
                                    {status === 'Submitted_For_Review' && (
                                        <>
                                            {isHODOrAdmin ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        disabled={isWorking}
                                                        onClick={() => setModerationModal({
                                                            isOpen: true,
                                                            paper,
                                                            action: 'Approve',
                                                            comments: 'Approved without objections.',
                                                            isSubmitting: false,
                                                        })}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                                                    >
                                                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={isWorking}
                                                        onClick={() => setModerationModal({
                                                            isOpen: true,
                                                            paper,
                                                            action: 'Reject',
                                                            comments: '',
                                                            isSubmitting: false,
                                                        })}
                                                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                    </Button>
                                                </>
                                            ) : (
                                                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-medium">
                                                    ⏳ Awaiting HOD Moderation
                                                </span>
                                            )}
                                        </>
                                    )}

                                    {/* Action 3: If Approved -> Export DOCX and Print PDF */}
                                    {status === 'Approved' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExportWord(paper)}
                                                className="bg-blue-950/60 border-blue-800 text-blue-300 hover:text-white hover:bg-blue-800 text-xs"
                                            >
                                                <Download className="w-3.5 h-3.5 mr-1 text-blue-400" /> Word (.docx)
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setPreviewPaper(paper);
                                                    setTimeout(() => window.print(), 350);
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20 text-xs font-semibold"
                                            >
                                                <Printer className="w-3.5 h-3.5 mr-1" /> Print / PDF
                                            </Button>
                                        </>
                                    )}

                                    {/* Action 4: If Rejected -> Re-generate / Move to Draft */}
                                    {status === 'Rejected' && (
                                        <Button
                                            size="sm"
                                            disabled={isWorking}
                                            onClick={() => handleStatusTransition(paper.id, 'Draft')}
                                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                            Move to Draft
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Moderation Review / Comment Modal */}
            <AnimatePresence>
                {moderationModal.isOpen && moderationModal.paper && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
                        >
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <div className="flex items-center space-x-2">
                                    {moderationModal.action === 'Approve' ? (
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                            <Check className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                                            <XCircle className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {moderationModal.action === 'Approve' ? 'Approve Question Paper' : 'Reject Question Paper'}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            HOD Moderation Decision for &ldquo;{moderationModal.paper.title}&rdquo;
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModerationModal({ isOpen: false, paper: null, action: 'Approve', comments: '', isSubmitting: false })}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-300">
                                    {moderationModal.action === 'Approve'
                                        ? 'Approval Comments (Optional)'
                                        : 'Rejection Reason / Feedback for Faculty (Required)'}
                                </label>
                                <textarea
                                    rows={4}
                                    value={moderationModal.comments}
                                    onChange={(e) => setModerationModal(prev => ({ ...prev, comments: e.target.value }))}
                                    placeholder={
                                        moderationModal.action === 'Approve'
                                            ? 'e.g. Approved. Bloom\'s level and difficulty distribution comply with autonomous syllabus criteria.'
                                            : 'e.g. Question 3 has difficulty mismatch with Blueprint Section B. Please replace with a higher Bloom\'s application question.'
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                                <Button
                                    variant="ghost"
                                    onClick={() => setModerationModal({ isOpen: false, paper: null, action: 'Approve', comments: '', isSubmitting: false })}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={moderationModal.isSubmitting || (moderationModal.action === 'Reject' && !moderationModal.comments.trim())}
                                    onClick={handleConfirmModeration}
                                    className={
                                        moderationModal.action === 'Approve'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
                                            : 'bg-rose-600 hover:bg-rose-700 text-white font-bold'
                                    }
                                >
                                    {moderationModal.isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                                    ) : null}
                                    {moderationModal.action === 'Approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Preview Modal */}
            <AnimatePresence>
                {previewPaper && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:static print:p-0 print:bg-white print:m-0 print:block">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] flex flex-col print:bg-white print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:max-h-none print:w-full print:block"
                        >
                            <div className="no-print flex justify-between items-center border-b border-slate-800 pb-3">
                                <div className="flex items-center space-x-3">
                                    <FileText className="w-6 h-6 text-amber-500" />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{previewPaper.title}</h3>
                                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                            <span>Total Marks: {previewPaper.total_marks || previewPaper.totalMarks || 50}</span>
                                            <span>•</span>
                                            <span>Status:</span>
                                            {renderStatusBadge(previewPaper.status)}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewPaper(null)} className="text-slate-400 hover:text-white p-1">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Official PCCOER Paper Preview Render with dynamic institution headers */}
                            <div className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-800 p-2 md:p-6 rounded-xl text-slate-200 print:overflow-visible print:bg-white print:border-none print:p-0 print:m-0 print:text-black">
                                <CollegeQuestionPaper
                                    paper={previewPaper}
                                    collegeName={institutionSettings?.college_name}
                                    trustName={institutionSettings?.trust_name}
                                    affiliation={institutionSettings?.affiliation}
                                    iqacText={institutionSettings?.iqac_text}
                                    recordNo={institutionSettings?.record_no}
                                    department={institutionSettings?.department}
                                    academicYear={institutionSettings?.academic_year}
                                />
                            </div>

                            <div className="no-print flex justify-between items-center pt-2 border-t border-slate-800">
                                <div className="flex items-center gap-2">
                                    {previewPaper.status === 'Approved' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleExportWord(previewPaper)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                                        >
                                            <Download className="w-3.5 h-3.5 mr-1" /> Export Word (.docx)
                                        </Button>
                                    )}
                                </div>
                                <Button variant="ghost" onClick={() => setPreviewPaper(null)} className="text-slate-400 hover:text-white">
                                    Close Preview
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
