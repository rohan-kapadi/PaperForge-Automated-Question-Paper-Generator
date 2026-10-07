'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useSelectionStore, Question } from '@/store/useSelectionStore';
import { Search, Plus, Trash2, Save, FileCheck, AlertCircle, Loader2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { mockBlueprints, Blueprint } from '@/lib/mockData';

const BACKEND_URL = 'http://localhost:3001';

export default function ManualSelectionPage() {
    const { selectedQuestions, addQuestion, removeQuestion, clearSelection, totalMarks, isSelected } = useSelectionStore();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
    const [banks, setBanks] = useState<any[]>([]);
    const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [resQ, resB] = await Promise.all([
                    fetch(`${BACKEND_URL}/questions`),
                    fetch(`${BACKEND_URL}/questions/banks`)
                ]);
                if (resQ.ok) setQuestions(await resQ.json());
                if (resB.ok) setBanks(await resB.json());
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    const filteredQuestions = questions.filter(q => {
        const textToSearch = q.question_text || '';
        const subjectToSearch = q.subject || '';
        
        const matchesSearch = textToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subjectToSearch.toLowerCase().includes(searchTerm.toLowerCase());
            
        // Strict bank ID matching
        const matchesBank = selectedBankIds.length === 0 || (q.bank_id && selectedBankIds.includes(q.bank_id));

        return matchesSearch && matchesBank;
    });

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    if (step === 1) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col space-y-6 h-full p-4"
            >
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                    <span className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-amber-400 flex-shrink-0" />
                        <span>Tip: Manual question selection is now integrated directly into the new <strong>Generate Paper</strong> wizard.</span>
                    </span>
                    <Link href="/dashboard/generate">
                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-7 text-xs ml-3">
                            Open Wizard <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </Link>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Select Blueprint</h2>
                    <p className="text-slate-400 text-sm">Choose a blueprint before manually selecting questions.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mockBlueprints.map((bp) => (
                        <Card 
                            key={bp.id} 
                            className={cn("cursor-pointer border-2 transition-all bg-slate-900/50 hover:bg-slate-900/80", selectedBlueprint?.id === bp.id ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-slate-800")}
                            onClick={() => setSelectedBlueprint(bp)}
                        >
                            <CardHeader>
                                <CardTitle className="text-white">{bp.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    {bp.sections.map(s => (
                                        <li key={s.id} className="flex justify-between">
                                            <span>{s.name} ({s.numberOfQuestions} × {s.marksPerQuestion}m)</span>
                                            <span className="text-slate-300 font-medium">{s.totalMarks}m</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Total Marks</span>
                                    <span className="text-amber-500 font-bold text-lg">
                                        {bp.sections.reduce((acc, s) => acc + s.totalMarks, 0)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <Button 
                        disabled={!selectedBlueprint}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                        onClick={() => setStep(2)}
                    >
                        Continue to Questions <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </motion.div>
        );
    }

    if (step === 2) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col space-y-6 h-full p-4"
            >
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => setStep(1)} className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Select Question Banks</h2>
                        <p className="text-slate-400 text-sm">Choose which question banks to source questions from.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {banks.length === 0 && !isLoading && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                            <p className="text-slate-400">No question banks found. You can skip this step.</p>
                        </div>
                    )}
                    {banks.map((bank: any) => {
                        const isSelected = selectedBankIds.includes(bank.id);
                        return (
                            <Card 
                                key={bank.id} 
                                className={cn("cursor-pointer border-2 transition-all bg-slate-900/50 hover:bg-slate-900/80", isSelected ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "border-slate-800")}
                                onClick={() => {
                                    if (isSelected) {
                                        setSelectedBankIds(prev => prev.filter(id => id !== bank.id));
                                    } else {
                                        setSelectedBankIds(prev => [...prev, bank.id]);
                                    }
                                }}
                            >
                                <CardHeader className="pb-3 border-b border-slate-800/50">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-base text-white line-clamp-1" title={bank.name}>{bank.name}</CardTitle>
                                        <div className="flex space-x-2 items-center">
                                            {isSelected && <FileCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Are you sure you want to delete ${bank.name}? This will delete all associated questions.`)) {
                                                        try {
                                                            await fetch(`${BACKEND_URL}/questions/banks/${bank.id}`, { method: 'DELETE' });
                                                            setBanks(prev => prev.filter(b => b.id !== bank.id));
                                                            setSelectedBankIds(prev => prev.filter(id => id !== bank.id));
                                                        } catch (err) {
                                                            console.error('Failed to delete from backend', err);
                                                        }
                                                    }
                                                }}
                                                className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                                                title="Delete Bank and its questions"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <Badge className="w-fit text-slate-300 border-slate-700 bg-slate-800 mt-2">{bank.subject || 'General'}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-500">Uploaded {bank.created_at ? new Date(bank.created_at).toLocaleDateString() : 'N/A'}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="flex justify-end pt-4">
                    <Button 
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                        onClick={() => setStep(3)}
                    >
                        {selectedBankIds.length > 0 ? "Continue to Questions" : "Skip & Continue"} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </motion.div>
        );
    }

    const targetTotalMarks = selectedBlueprint?.sections.reduce((acc, s) => acc + s.totalMarks, 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 lg:h-[calc(100vh-8rem)] bg-slate-950"
        >

            {/* Left Column: Question Browser */}
            <div className="lg:col-span-7 flex flex-col h-full space-y-4">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={() => setStep(2)} className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Question Browser</h2>
                        <p className="text-slate-400 text-sm">Select questions for: <span className="text-amber-400">{selectedBlueprint?.name}</span></p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search questions by text or subject..."
                        className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                            <p className="text-slate-400 text-sm">Loading questions...</p>
                        </div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-10 bg-slate-900/30 border border-slate-800 rounded-xl">
                            <p className="text-slate-400 text-sm">No questions found.</p>
                        </div>
                    ) : (
                        filteredQuestions.map((question) => {
                            const selected = isSelected(question.id);
                            return (
                                <div
                                    key={question.id}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer group hover:bg-slate-900/80",
                                        selected
                                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                                            : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                                    )}
                                    onClick={() => selected ? removeQuestion(question.id) : addQuestion(question)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getDifficultyColor(question.difficulty)}>
                                                {question.difficulty || 'Medium'}
                                            </Badge>
                                            <span className="text-xs text-slate-500 font-mono tracking-wider">{question.subject || 'General'}</span>
                                        </div>
                                        <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                                            {question.marks || 5} Marks
                                        </Badge>
                                    </div>

                                    <p className={cn("text-sm mb-3", selected ? "text-amber-100" : "text-slate-300")}>
                                        {question.question_text}
                                    </p>

                                    <div className="flex justify-end items-center text-xs text-slate-500">
                                        {selected ? (
                                            <span className="flex items-center text-amber-500 font-bold">
                                                <FileCheck className="w-3 h-3 mr-1" /> Added
                                            </span>
                                        ) : (
                                            <span className="flex items-center group-hover:text-amber-400 transition-colors">
                                                <Plus className="w-3 h-3 mr-1" /> Add Question
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Column: Selection Summary (Sticky) */}
            <div className="lg:col-span-5 h-full flex flex-col">
                <Card className="h-full bg-slate-950 border-slate-800 flex flex-col shadow-2xl">
                    <CardHeader className="border-b border-slate-800 bg-slate-900/50">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-white">Selected Paper</CardTitle>
                                <CardDescription className="text-slate-400">{selectedQuestions.length} questions selected</CardDescription>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-amber-500">
                                    {totalMarks() || 0} <span className="text-lg text-slate-500 font-normal">/ {targetTotalMarks}</span>
                                </div>
                                <div className="text-xs text-slate-500 uppercase tracking-wider">Total Marks</div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedQuestions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 border-2 border-dashed border-slate-800 rounded-xl m-4 bg-slate-900/20">
                                <AlertCircle className="w-12 h-12 opacity-50" />
                                <p>No questions selected yet</p>
                            </div>
                        ) : (
                            selectedQuestions.map((q, index) => (
                                <div key={q.id} className="group flex items-start justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors relative pl-8">
                                    <span className="absolute left-3 top-3.5 text-xs text-slate-600 font-mono">Q{index + 1}</span>
                                    <div className="flex-1 pr-4">
                                        <p className="text-sm text-slate-300 line-clamp-2">{q.question_text}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-slate-500">({q.marks || 5}m)</span>
                                            <span className="text-xs text-slate-600">• {q.subject || 'General'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeQuestion(q.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </CardContent>

                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3">
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                                onClick={clearSelection}
                                disabled={selectedQuestions.length === 0}
                            >
                                Clear All
                            </Button>
                            <Button
                                className="flex-[2] bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                                disabled={selectedQuestions.length === 0 || totalMarks() !== targetTotalMarks}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {totalMarks() === targetTotalMarks ? "Save Paper" : "Match Marks"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}
