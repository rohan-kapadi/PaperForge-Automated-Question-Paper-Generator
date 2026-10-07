'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search,
    Loader2,
    Trash2,
    Sparkles,
    Edit3,
    Check,
    X,
    Filter,
    Bot,
    UserCheck,
    BrainCircuit,
    RefreshCw,
    Layers,
    Tag
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Question {
    id: string;
    text: string;
    question_text?: string;
    marks: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    blooms_level?: string;
    topic?: string;
    unit?: string;
    co?: string;
    question_type?: string;
    classification_source?: 'ai' | 'teacher' | 'rule' | 'default';
    metadata?: any;
    created_at?: string;
}

export default function LibraryPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [reanalyzeMsg, setReanalyzeMsg] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [filterBlooms, setFilterBlooms] = useState('all');
    const [filterUnit, setFilterUnit] = useState('all');
    const [filterType, setFilterType] = useState('all');

    // Teacher Edit Modal
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [editForm, setEditForm] = useState<{
        text: string;
        marks: number;
        difficulty: 'Easy' | 'Medium' | 'Hard';
        blooms_level: string;
        unit: string;
        topic: string;
        co: string;
        question_type: string;
    }>({
        text: '',
        marks: 5,
        difficulty: 'Medium',
        blooms_level: 'L2_Understand',
        unit: 'Unit 1',
        topic: 'General',
        co: 'CO1',
        question_type: 'Short Answer',
    });

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/questions`);
            if (!res.ok) throw new Error('Failed to fetch questions');
            const data = await res.json();
            const normalized = data.map((q: any) => ({
                id: q.id,
                text: q.text || q.question_text || '',
                marks: q.marks || 5,
                difficulty: q.difficulty || 'Medium',
                blooms_level: q.blooms_level || 'L2_Understand',
                topic: q.topic || 'General',
                unit: q.unit || null,
                co: q.co || 'CO1',
                question_type: q.question_type || 'Short Answer',
                classification_source: q.classification_source || 'ai',
                metadata: q.metadata || {},
                created_at: q.created_at,
            }));
            setQuestions(normalized);
        } catch (err) {
            console.error('Fetch questions error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return;
        setIsDeleting(id);
        try {
            const res = await fetch(`${BACKEND_URL}/questions/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete question');
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete question.');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleStartEdit = (q: Question) => {
        setEditingQuestion(q);
        setEditForm({
            text: q.text,
            marks: q.marks,
            difficulty: q.difficulty,
            blooms_level: q.blooms_level || 'L2_Understand',
            unit: q.unit || 'Unit 1',
            topic: q.topic || 'General',
            co: q.co || 'CO1',
            question_type: q.question_type || 'Short Answer',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingQuestion) return;
        setIsSavingEdit(true);
        try {
            const res = await fetch(`${BACKEND_URL}/questions/${editingQuestion.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    source: 'teacher',
                }),
            });

            if (!res.ok) throw new Error('Failed to update question');
            const updated = await res.json();

            setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? {
                ...q,
                ...editForm,
                classification_source: 'teacher',
                metadata: updated.metadata || q.metadata,
            } : q));

            setEditingQuestion(null);
        } catch (err) {
            console.error('Save edit error:', err);
            alert('Failed to save changes.');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleAnalyzeMissing = async () => {
        setIsReanalyzing(true);
        setReanalyzeMsg(null);
        try {
            const res = await fetch(`${BACKEND_URL}/questions/analyze-missing`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to re-analyze');
            const result = await res.json();
            setReanalyzeMsg(`Analyzed ${result.analyzed || 0} questions.`);
            fetchQuestions();
        } catch (err) {
            console.error('Analyze missing error:', err);
            setReanalyzeMsg('AI Parser Service offline or encountered an error.');
        } finally {
            setIsReanalyzing(false);
        }
    };

    // Derived filter options
    const uniqueUnits = Array.from(new Set(questions.map(q => q.unit).filter(Boolean))).sort();
    const uniqueBlooms = ['L1_Remember', 'L2_Understand', 'L3_Apply', 'L4_Analyze', 'L5_Evaluate', 'L6_Create'];
    const uniqueTypes = Array.from(new Set(questions.map(q => q.question_type).filter(Boolean))).sort();

    const filteredQuestions = questions.filter(q => {
        const textMatch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));
        const diffMatch = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        const bloomMatch = filterBlooms === 'all' || q.blooms_level === filterBlooms;
        const unitMatch = filterUnit === 'all' || q.unit === filterUnit;
        const typeMatch = filterType === 'all' || q.question_type === filterType;
        return textMatch && diffMatch && bloomMatch && unitMatch && typeMatch;
    });

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'Hard': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const getBloomsColor = (b?: string) => {
        if (!b) return 'bg-slate-800 text-slate-400 border-slate-700';
        if (b.includes('L1') || b.includes('L2')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        if (b.includes('L3') || b.includes('L4')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto pb-16"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
                        <BrainCircuit className="w-8 h-8 text-amber-400" />
                        Question Intelligence Library
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Curated questions with AI Bloom's classification, difficulty weighting, and teacher overrides.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAnalyzeMissing}
                        disabled={isReanalyzing}
                        className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                        {isReanalyzing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin text-amber-400" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2 text-amber-400" />
                        )}
                        Analyze Metadata
                    </Button>
                    <Link href="/dashboard/generate">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-9 shadow-lg shadow-amber-500/20">
                            <Sparkles className="w-4 h-4 mr-1.5" /> Generate Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {reanalyzeMsg && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm px-4 py-2.5 rounded-xl flex items-center justify-between">
                    <span>{reanalyzeMsg}</span>
                    <button onClick={() => setReanalyzeMsg(null)} className="text-amber-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-12 gap-3 shadow-lg">
                {/* Search */}
                <div className="md:col-span-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search questions or topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-10"
                    />
                </div>

                {/* Difficulty Filter */}
                <div className="md:col-span-2">
                    <select
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                {/* Bloom's Level Filter */}
                <div className="md:col-span-2">
                    <select
                        value={filterBlooms}
                        onChange={(e) => setFilterBlooms(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Bloom's Levels</option>
                        {uniqueBlooms.map(b => (
                            <option key={b} value={b}>{b.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {/* Unit Filter */}
                <div className="md:col-span-2">
                    <select
                        value={filterUnit}
                        onChange={(e) => setFilterUnit(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Units</option>
                        {uniqueUnits.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                {/* Type Filter */}
                <div className="md:col-span-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Types</option>
                        {uniqueTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results count badge */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Showing <strong className="text-white">{filteredQuestions.length}</strong> of {questions.length} questions</span>
                {(filterDifficulty !== 'all' || filterBlooms !== 'all' || filterUnit !== 'all' || filterType !== 'all' || searchTerm) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterDifficulty('all');
                            setFilterBlooms('all');
                            setFilterUnit('all');
                            setFilterType('all');
                        }}
                        className="text-amber-400 hover:underline"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-400 text-sm font-medium">Loading questions from live database...</p>
                </div>
            )}

            {/* Empty */}
            {!isLoading && questions.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
                    <p className="text-slate-400">No questions found in the database. Upload a question bank to get started.</p>
                    <Link href="/dashboard/upload" className="mt-4 inline-block">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold mt-2">
                            Upload Question Bank
                        </Button>
                    </Link>
                </div>
            )}

            {/* Questions Grid */}
            {!isLoading && filteredQuestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredQuestions.map((q) => {
                        const isTeacher = q.classification_source === 'teacher';
                        const confidence = q.metadata?.confidence?.overall
                            ? Math.round(q.metadata.confidence.overall * 100)
                            : null;

                        return (
                            <Card
                                key={q.id}
                                className="bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 transition-all group flex flex-col justify-between relative overflow-hidden p-4 rounded-2xl backdrop-blur-sm"
                            >
                                <div className="space-y-3">
                                    {/* Top Bar Badges */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                        <Badge className="bg-slate-800 text-amber-400 border-slate-700 font-mono font-bold">
                                            {q.marks} Marks
                                        </Badge>
                                        <Badge className={getDifficultyColor(q.difficulty)}>
                                            {q.difficulty}
                                        </Badge>
                                        <Badge className={getBloomsColor(q.blooms_level)}>
                                            {q.blooms_level ? q.blooms_level.replace('_', ' ') : 'L2 Understand'}
                                        </Badge>
                                        {q.unit && (
                                            <Badge className="bg-slate-800/80 text-slate-300 border-slate-700">
                                                {q.unit}
                                            </Badge>
                                        )}
                                        {q.co && (
                                            <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                                                {q.co}
                                            </Badge>
                                        )}
                                        {q.question_type && (
                                            <span className="text-[11px] text-slate-400 px-1.5 py-0.5 bg-slate-950/60 rounded border border-slate-800">
                                                {q.question_type}
                                            </span>
                                        )}
                                    </div>

                                    {/* Question Text */}
                                    <p className="text-sm text-slate-100 font-normal leading-relaxed pt-1">
                                        {q.text}
                                    </p>
                                </div>

                                {/* Footer & Actions */}
                                <div className="pt-3 border-t border-slate-800/70 mt-3 flex items-center justify-between text-xs text-slate-400">
                                    <div className="flex items-center space-x-2">
                                        {isTeacher ? (
                                            <span className="inline-flex items-center text-emerald-400 text-[11px]">
                                                <UserCheck className="w-3.5 h-3.5 mr-1" /> Teacher Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-400 text-[11px]">
                                                <Bot className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                                AI Classified {confidence ? `(${confidence}%)` : ''}
                                            </span>
                                        )}
                                        {q.topic && q.topic !== 'General' && (
                                            <span className="text-slate-500">• {q.topic}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => handleStartEdit(q)}
                                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                            title="Edit / Override classification"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            disabled={isDeleting === q.id}
                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete question"
                                        >
                                            {isDeleting === q.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Teacher Edit Modal */}
            <AnimatePresence>
                {editingQuestion && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Edit3 className="w-5 h-5 text-amber-400" />
                                        Teacher Metadata Override
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Teacher overrides take strict precedence over AI classification.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEditingQuestion(null)}
                                    className="text-slate-400 hover:text-white p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <label className="block text-slate-300 font-medium mb-1">Question Text</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.text}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, text: e.target.value }))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Marks</label>
                                        <input
                                            type="number"
                                            value={editForm.marks}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, marks: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Difficulty</label>
                                        <select
                                            value={editForm.difficulty}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="Easy">Easy</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Bloom's Taxonomy Level</label>
                                        <select
                                            value={editForm.blooms_level}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, blooms_level: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="L1_Remember">L1 Remember</option>
                                            <option value="L2_Understand">L2 Understand</option>
                                            <option value="L3_Apply">L3 Apply</option>
                                            <option value="L4_Analyze">L4 Analyze</option>
                                            <option value="L5_Evaluate">L5 Evaluate</option>
                                            <option value="L6_Create">L6 Create</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Question Type</label>
                                        <select
                                            value={editForm.question_type}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, question_type: e.target.value }))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="Short Answer">Short Answer</option>
                                            <option value="Long Answer">Long Answer</option>
                                            <option value="MCQ">MCQ</option>
                                            <option value="Numerical">Numerical</option>
                                            <option value="Definition">Definition</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Unit</label>
                                        <input
                                            type="text"
                                            value={editForm.unit}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, unit: e.target.value }))}
                                            placeholder="Unit 1"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Course Outcome (CO)</label>
                                        <input
                                            type="text"
                                            value={editForm.co}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, co: e.target.value }))}
                                            placeholder="CO1"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 font-medium mb-1">Topic</label>
                                        <input
                                            type="text"
                                            value={editForm.topic}
                                            onChange={(e) => setEditForm(prev => ({ ...prev, topic: e.target.value }))}
                                            placeholder="Topic"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingQuestion(null)}
                                    className="bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSaveEdit}
                                    disabled={isSavingEdit}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                                >
                                    {isSavingEdit ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Save Override
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
