'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    MessageSquare,
    FileText,
    Download,
    User,
    Calendar,
    BookOpen,
    Loader2,
    AlertCircle,
    Sparkles,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Check,
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
    subject?: string;
}

type TabType = 'pending' | 'approved' | 'rejected';

const tabConfig = {
    pending: { label: 'Pending Approval', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
};

function HODDashboardContent() {
    const { isHODOrAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlTab = searchParams.get('tab') as TabType | null;

    const [activeTab, setActiveTab] = useState<TabType>(urlTab && ['pending', 'approved', 'rejected'].includes(urlTab) ? urlTab : 'pending');
    const [papers, setPapers] = useState<Record<TabType, Paper[]>>({ pending: [], approved: [], rejected: [] });
    const [counts, setCounts] = useState<Record<TabType, number>>({ pending: 0, approved: 0, rejected: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [approvalModal, setApprovalModal] = useState<{ paper: Paper; action: 'approve' | 'reject' } | null>(null);
    const [comment, setComment] = useState('');
    const [isActioning, setIsActioning] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Sync tab from URL if changes
    useEffect(() => {
        if (urlTab && ['pending', 'approved', 'rejected'].includes(urlTab)) {
            setActiveTab(urlTab);
        }
    }, [urlTab]);

    // Guard: only HOD/Admin can access this page
    useEffect(() => {
        if (!authLoading && !isHODOrAdmin) {
            router.replace('/dashboard');
        }
    }, [authLoading, isHODOrAdmin, router]);

    const fetchPapers = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/papers');
            if (res.ok) {
                const data = await res.json();
                const list: Paper[] = Array.isArray(data) ? data : (data.papers || data.data || []);

                const pendingList: Paper[] = [];
                const approvedList: Paper[] = [];
                const rejectedList: Paper[] = [];

                list.forEach((paper) => {
                    const st = (paper.status || '').toLowerCase();
                    if (st === 'approved') {
                        approvedList.push(paper);
                    } else if (st === 'rejected') {
                        rejectedList.push(paper);
                    } else {
                        // 'submitted_for_review', 'generated', 'draft', 'pending'
                        pendingList.push(paper);
                    }
                });

                const results = {
                    pending: pendingList,
                    approved: approvedList,
                    rejected: rejectedList,
                };

                setPapers(results);
                setCounts({
                    pending: results.pending.length,
                    approved: results.approved.length,
                    rejected: results.rejected.length,
                });
            }
        } catch (err) {
            console.error('Failed to fetch papers:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isHODOrAdmin) {
            fetchPapers();
        }
    }, [authLoading, isHODOrAdmin]);

    const handleAction = async () => {
        if (!approvalModal) return;
        setIsActioning(true);
        setActionError(null);

        const targetStatus = approvalModal.action === 'approve' ? 'Approved' : 'Rejected';

        try {
            const res = await apiFetch(`/papers/${approvalModal.paper.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: targetStatus,
                    moderation_comments: comment.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || 'Action failed');
            }

            setApprovalModal(null);
            setComment('');
            await fetchPapers();
        } catch (err: any) {
            setActionError(err.message || 'Something went wrong');
        } finally {
            setIsActioning(false);
        }
    };

    const handleDownload = async (paper: Paper) => {
        setDownloadingId(paper.id);
        try {
            // Try direct docx export via backend API
            const res = await apiFetch(`/papers/${paper.id}/export/docx`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${(paper.title || 'Question_Paper').replace(/\s+/g, '_')}_PCCOER.docx`;
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
                a.download = `${(paper.title || 'Question_Paper').replace(/\s+/g, '_')}_PCCOER.docx`;
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

    const currentPapers = papers[activeTab];

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">HOD Approval Dashboard</h2>
                    <p className="text-slate-400 mt-1 text-sm">Review, evaluate, and approve question papers submitted by faculty</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(Object.entries(tabConfig) as [TabType, typeof tabConfig.pending][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = activeTab === key;
                    return (
                        <motion.div
                            key={key}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setActiveTab(key)}
                            className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                isSelected
                                    ? `${cfg.bg} ${cfg.border} ring-1 ring-inset ${cfg.border}`
                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400 font-medium">{cfg.label}</p>
                                    <p className={`text-3xl font-bold mt-1 ${isSelected ? cfg.color : 'text-white'}`}>
                                        {isLoading ? '—' : counts[key]}
                                    </p>
                                </div>
                                <div className={`w-11 h-11 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Tab Selector */}
            <div className="flex space-x-1 bg-slate-900/50 border border-slate-800 rounded-xl p-1">
                {(Object.entries(tabConfig) as [TabType, typeof tabConfig.pending][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const isSelected = activeTab === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                    ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {cfg.label}
                            {key === 'pending' && counts.pending > 0 && (
                                <span className="bg-amber-500 text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {counts.pending}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Papers List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
            ) : currentPapers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl p-8">
                    <div className={`w-14 h-14 rounded-2xl ${tabConfig[activeTab].bg} border ${tabConfig[activeTab].border} flex items-center justify-center mb-4`}>
                        {(() => { const Icon = tabConfig[activeTab].icon; return <Icon className={`w-7 h-7 ${tabConfig[activeTab].color}`} />; })()}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">No {tabConfig[activeTab].label} Papers</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                        {activeTab === 'pending'
                            ? 'All caught up! There are currently no pending question papers waiting for HOD review.'
                            : `No question papers are classified under ${activeTab}.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {currentPapers.map((paper) => (
                            <motion.div
                                key={paper.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                            >
                                {/* Paper Row */}
                                <div className="flex items-center gap-4 p-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shrink-0">
                                        <FileText className="w-5 h-5 text-amber-400" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-semibold text-white truncate">{paper.title}</h3>
                                            {paper.exam_type && (
                                                <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                                                    {paper.exam_type}
                                                </Badge>
                                            )}
                                            <Badge className={`text-[10px] ${
                                                activeTab === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                                activeTab === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                            }`}>
                                                {paper.status || (activeTab === 'pending' ? 'Pending Review' : activeTab)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 flex-wrap">
                                            {paper.submitted_by_name && (
                                                <span className="flex items-center gap-1 text-slate-300">
                                                    <User className="w-3.5 h-3.5 text-amber-400" /> {paper.submitted_by_name}
                                                </span>
                                            )}
                                            {(paper.total_marks || paper.totalMarks) && (
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3.5 h-3.5 text-slate-500" /> {paper.total_marks || paper.totalMarks} marks
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" /> {formatDate(paper.created_at)}
                                            </span>
                                        </div>
                                        {paper.moderation_comments && activeTab !== 'pending' && (
                                            <p className={`mt-2 text-xs italic px-2.5 py-1.5 rounded-lg border ${
                                                activeTab === 'rejected'
                                                    ? 'bg-red-500/10 text-red-300 border-red-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            }`}>
                                                Feedback: &quot;{paper.moderation_comments}&quot;
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setExpandedPaper(expandedPaper === paper.id ? null : paper.id)}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                                            title="Toggle preview"
                                        >
                                            {expandedPaper === paper.id ? (
                                                <><ChevronUp className="w-4 h-4" /> Close</>
                                            ) : (
                                                <><Eye className="w-4 h-4" /> Preview</>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => handleDownload(paper)}
                                            disabled={downloadingId === paper.id}
                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Download DOCX"
                                        >
                                            {downloadingId === paper.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                        </button>

                                        {activeTab === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => { setApprovalModal({ paper, action: 'approve' }); setComment(''); setActionError(null); }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 shadow-lg shadow-emerald-600/20"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => { setApprovalModal({ paper, action: 'reject' }); setComment(''); setActionError(null); }}
                                                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                                                >
                                                    <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                                                </Button>
                                            </>
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
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Approval / Rejection Modal */}
            <AnimatePresence>
                {approvalModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setApprovalModal(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg p-6"
                        >
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    approvalModal.action === 'approve' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                                }`}>
                                    {approvalModal.action === 'approve'
                                        ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        : <XCircle className="w-5 h-5 text-red-400" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {approvalModal.action === 'approve' ? 'Approve Question Paper' : 'Reject Question Paper'}
                                    </h3>
                                    <p className="text-sm text-slate-400 truncate max-w-sm">{approvalModal.paper.title}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                                        {approvalModal.action === 'approve' ? 'Feedback / Notes (Optional)' : 'Reason for Rejection (Required)'}
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={4}
                                        placeholder={approvalModal.action === 'approve'
                                            ? 'Add comments for Exam Section or faculty (optional)...'
                                            : 'Please explain what needs to be changed (e.g., marks distribution, question coverage)...'}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                                    />
                                </div>

                                {approvalModal.action === 'reject' && !comment.trim() && (
                                    <p className="text-xs text-amber-400 flex items-center gap-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        Please provide clear feedback so the faculty member can revise the paper.
                                    </p>
                                )}

                                {actionError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        {actionError}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                                    onClick={() => setApprovalModal(null)}
                                    disabled={isActioning}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className={`flex-1 font-bold ${
                                        approvalModal.action === 'approve'
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                                            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                    }`}
                                    onClick={handleAction}
                                    disabled={isActioning || (approvalModal.action === 'reject' && !comment.trim())}
                                >
                                    {isActioning ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                                    ) : (
                                        approvalModal.action === 'approve' ? 'Confirm & Approve' : 'Confirm & Reject'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function HODDashboard() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        }>
            <HODDashboardContent />
        </Suspense>
    );
}
