'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Database,
    Sparkles,
    Upload,
    Search,
    Trash2,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
    Clock,
    Plus,
    Loader2,
    CloudUpload,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface QuestionBank {
    id: string;
    name: string;
    subject?: string;
    file_type?: string;
    created_at?: string;
    questions_count?: number;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string, type?: string) {
    const ext = (type || name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return <FileText className="w-6 h-6 text-red-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-6 h-6 text-blue-400" />;
    return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
}

export default function QuestionBanksPage() {
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchBanks = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/questions/banks`);
            if (res.ok) {
                const data = await res.json();
                setBanks(data);
            }
        } catch (err) {
            console.error('Failed to fetch banks:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks();
    }, []);

    const handleUploadFile = useCallback(async (file: File) => {
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(null);

        try {
            const form = new FormData();
            form.append('file', file);

            const res = await fetch(`${BACKEND_URL}/questions/upload`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(errData.message || 'Failed to upload question bank');
            }

            const data = await res.json();
            setUploadSuccess(`Successfully extracted ${data.total || 0} questions from ${file.name}`);
            fetchBanks();
            setTimeout(() => {
                setShowUploadModal(false);
                setUploadSuccess(null);
            }, 1800);
        } catch (err: any) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleDeleteBank = async (bankId: string, bankName: string) => {
        if (!confirm(`Are you sure you want to delete "${bankName}"? This will delete all questions in this bank.`)) {
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/questions/banks/${bankId}`, { method: 'DELETE' });
            if (res.ok) {
                setBanks(prev => prev.filter(b => b.id !== bankId));
            }
        } catch (err) {
            console.error('Failed to delete bank:', err);
            alert('Failed to delete question bank.');
        }
    };

    const subjects = Array.from(new Set(banks.map(b => b.subject || 'General'))).filter(Boolean).sort();

    const filteredBanks = banks.filter(bank => {
        const matchesSearch = (bank.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bank.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = selectedSubject === 'all' || (bank.subject || 'General') === selectedSubject;
        return matchesSearch && matchesSubject;
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Question Banks</h2>
                    <p className="text-slate-400">Manage uploaded syllabus sources and start exam generation directly.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Upload Question Bank
                    </Button>
                    <Link href="/dashboard/generate">
                        <Button className="bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700">
                            <Sparkles className="w-4 h-4 mr-2 text-amber-400" /> Generate Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Upload Expandable / Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">Upload New Question Bank</h3>
                                <p className="text-xs text-slate-400">Supported formats: PDF, DOCX, XLSX, XLS, CSV</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUploadModal(false)}
                                className="text-slate-500 hover:text-white"
                            >
                                Close
                            </Button>
                        </div>

                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-2 text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{uploadError}</span>
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-400 text-sm">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>{uploadSuccess}</span>
                            </div>
                        )}

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) handleUploadFile(file);
                            }}
                            onClick={() => inputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                isDragging
                                    ? 'border-amber-500 bg-amber-500/10'
                                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                            }`}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadFile(file);
                                }}
                            />
                            {isUploading ? (
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                                    <p className="text-sm font-semibold text-slate-200">Parsing questions and extracting metadata...</p>
                                    <p className="text-xs text-slate-500">FastAPI Parser is categorizing questions by topic and difficulty</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <CloudUpload className="w-10 h-10 text-slate-500 group-hover:text-amber-500 transition-colors" />
                                    <p className="text-sm font-medium text-slate-200">Click to upload or drag & drop files here</p>
                                    <p className="text-xs text-slate-500">PDF, DOCX, Excel spreadsheets, or CSV files</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter & Search */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search question banks by title or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-11"
                    />
                </div>
                <div className="md:col-span-4">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-11 rounded-xl bg-slate-900/50 border border-slate-800 text-white px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                        <option value="all">All Subjects ({banks.length})</option>
                        {subjects.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Banks Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">Loading question banks...</p>
                </div>
            ) : filteredBanks.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/30 border border-slate-800 rounded-2xl space-y-4">
                    <Database className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-white">No question banks found</h3>
                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Upload your question papers, syllabus banks, or spreadsheets to get started with automated paper generation.
                    </p>
                    <Button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Upload First Question Bank
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBanks.map((bank) => (
                        <Card
                            key={bank.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group backdrop-blur-sm"
                        >
                            <CardHeader className="pb-3 border-b border-slate-800/50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                                            {getFileIcon(bank.name, bank.file_type)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base text-white line-clamp-1 group-hover:text-amber-400 transition-colors" title={bank.name}>
                                                {bank.name}
                                            </CardTitle>
                                            <Badge className="text-xs bg-slate-800 text-slate-300 border-slate-700 mt-1">
                                                {bank.subject || 'General'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBank(bank.id, bank.name)}
                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                        title="Delete Question Bank"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-4 space-y-4">
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span className="flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                        {bank.created_at ? new Date(bank.created_at).toLocaleDateString() : 'Recent'}
                                    </span>
                                    <span className="text-amber-400 font-medium">
                                        {bank.questions_count ? `${bank.questions_count} Questions` : 'Ready'}
                                    </span>
                                </div>

                                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                                    <Link
                                        href={`/dashboard/library?bankId=${bank.id}`}
                                        className="text-xs text-slate-400 hover:text-white transition-colors"
                                    >
                                        Browse Questions
                                    </Link>
                                    <Link href={`/dashboard/generate?bankId=${bank.id}&subject=${encodeURIComponent(bank.subject || '')}`}>
                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-8 text-xs">
                                            <Sparkles className="w-3.5 h-3.5 mr-1" /> Generate Paper
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
