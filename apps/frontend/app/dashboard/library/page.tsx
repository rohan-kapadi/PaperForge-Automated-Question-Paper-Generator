'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND_URL = 'http://localhost:3001';

interface Question {
    id: string;
    question_text: string;
    subject: string;
    created_at: string;
}

export default function LibraryPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/questions`);
            if (!res.ok) throw new Error('Failed to fetch questions');
            const data = await res.json();
            setQuestions(data);
        } catch (err) {
            console.error(err);
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
            const res = await fetch(`${BACKEND_URL}/questions/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete question');
            
            // Remove from local state
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete question. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const subjects = Array.from(new Set(questions.map(q => q.subject))).filter(Boolean).sort();

    const filteredQuestions = questions.filter(q => {
        const textToSearch = q.question_text || '';
        const subjectToSearch = q.subject || '';
        const matchesSearch = textToSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subjectToSearch.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
        return matchesSearch && matchesSubject;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Question Library</h2>
                    <p className="text-slate-400">Manage and browse your extracted questions.</p>
                </div>
                <Badge className="text-slate-400 border-slate-700 bg-slate-900 px-3 py-1">
                    {filteredQuestions.length} Questions Found
                </Badge>
            </div>

            {/* Filters Bar */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search by keyword or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-10"
                    />
                </div>
                <div className="md:col-span-4">
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                    <p className="text-slate-400">Loading questions from Supabase...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && questions.length === 0 && (
                <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-xl">
                    <p className="text-slate-400">No questions found. Upload a file to get started.</p>
                </div>
            )}

            {/* Questions Grid */}
            {!isLoading && filteredQuestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuestions.map((question) => (
                        <Card key={question.id} className="bg-slate-900/40 border-slate-800 hover:border-slate-600 hover:bg-slate-900/80 transition-all group flex flex-col justify-between relative overflow-hidden">
                            <CardHeader className="pb-3 pr-12">
                                <h3 className="text-base text-slate-200 font-medium leading-relaxed group-hover:text-amber-400 transition-colors">
                                    {question.question_text}
                                </h3>
                            </CardHeader>
                            <CardContent>
                                <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center">
                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                                        {question.subject ?? 'General'}
                                    </Badge>
                                </div>
                            </CardContent>
                            
                            {/* Delete Button */}
                            <button
                                onClick={() => handleDelete(question.id)}
                                disabled={isDeleting === question.id}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete question"
                            >
                                {isDeleting === question.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </Card>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
