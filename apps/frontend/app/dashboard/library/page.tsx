'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockQuestions } from '@/lib/mockData';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LibraryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');

    const filteredQuestions = mockQuestions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.topic.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUnit = selectedUnit === 'all' || q.unit === selectedUnit;
        const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
        return matchesSearch && matchesUnit && matchesDifficulty;
    });

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Question Library</h2>
                    <p className="text-slate-400">Manage and browse your question database.</p>
                </div>
                <Badge className="text-slate-400 border-slate-700 bg-slate-900 px-3 py-1">
                    {filteredQuestions.length} Questions Found
                </Badge>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search by keyword or topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-10"
                    />
                </div>
                <div className="md:col-span-3">
                    <select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Units</option>
                        <option value="Unit 1">Unit 1</option>
                        <option value="Unit 2">Unit 2</option>
                        <option value="Unit 3">Unit 3</option>
                        <option value="Unit 4">Unit 4</option>
                        <option value="Unit 5">Unit 5</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuestions.map((question) => (
                    <Card key={question.id} className="bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-900/80 transition-all group cursor-pointer">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between mb-3">
                                <Badge className={`${getDifficultyColor(question.difficulty)} border`}>
                                    {question.difficulty}
                                </Badge>
                                <div className="bg-slate-800 px-2 py-1 rounded text-xs font-semibold text-slate-300 border border-slate-700">
                                    {question.marks} marks
                                </div>
                            </div>
                            <h3 className="text-base text-slate-200 font-medium leading-relaxed group-hover:text-amber-400 transition-colors line-clamp-3">
                                {question.text}
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">{question.unit}</span>
                                <span className="font-medium text-slate-400">{question.topic}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
}
