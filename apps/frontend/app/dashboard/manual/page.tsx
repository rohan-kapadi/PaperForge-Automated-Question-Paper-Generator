'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockQuestions } from '@/lib/mockData';
import { useSelectionStore } from '@/store/useSelectionStore';
import { Search, Plus, Trash2, Save, FileCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ManualSelectionPage() {
    const { selectedQuestions, addQuestion, removeQuestion, clearSelection, totalMarks, isSelected } = useSelectionStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredQuestions = mockQuestions.filter(q =>
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'Hard': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 lg:h-[calc(100vh-8rem)] bg-slate-950"
        >

            {/* Left Column: Question Browser */}
            <div className="lg:col-span-7 flex flex-col h-full space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Question Browser</h2>
                    <p className="text-slate-400 text-sm">Select questions to add to your paper manually.</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {filteredQuestions.map((question) => {
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
                                            {question.difficulty}
                                        </Badge>
                                        <span className="text-xs text-slate-500 font-mono tracking-wider">UNIT {question.unit.replace('Unit ', '')}</span>
                                    </div>
                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                                        {question.marks} Marks
                                    </Badge>
                                </div>

                                <p className={cn("text-sm mb-3", selected ? "text-amber-100" : "text-slate-300")}>
                                    {question.text}
                                </p>

                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{question.topic}</span>
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
                    })}
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
                                <div className="text-3xl font-bold text-amber-500">{totalMarks()}</div>
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
                                        <p className="text-sm text-slate-300 line-clamp-2">{q.text}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-slate-500">({q.marks}m)</span>
                                            <span className="text-xs text-slate-600">• {q.difficulty}</span>
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
                                disabled={selectedQuestions.length === 0}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Save Paper
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </motion.div>
    );
}
