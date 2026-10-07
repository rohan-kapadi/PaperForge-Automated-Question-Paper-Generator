'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Plus, Sparkles, Trash2, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { mockBlueprints, Blueprint, BlueprintSection } from '@/lib/mockData';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExtendedSection extends BlueprintSection {
    difficulty?: string[];
    blooms_levels?: string[];
}

export default function BlueprintsPage() {
    const [blueprints, setBlueprints] = useState<Blueprint[]>(mockBlueprints);
    const [isLoading, setIsLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [newTitle, setNewTitle] = useState('');
    const [examType, setExamType] = useState('Unit_Test_1');
    const [durationMinutes, setDurationMinutes] = useState(90);
    const [subjectCode, setSubjectCode] = useState('ENG-202');
    const [sections, setSections] = useState<ExtendedSection[]>([
        {
            id: 's1',
            name: 'Part A (Objective / Short Answer)',
            marksPerQuestion: 2,
            numberOfQuestions: 10,
            totalMarks: 20,
            difficulty: ['Easy', 'Medium'],
            blooms_levels: ['L1_Remember', 'L2_Understand'],
        },
        {
            id: 's2',
            name: 'Part B (Analytical / Descriptive)',
            marksPerQuestion: 6,
            numberOfQuestions: 5,
            totalMarks: 30,
            difficulty: ['Medium', 'Hard'],
            blooms_levels: ['L3_Apply', 'L4_Analyze'],
        },
    ]);

    const fetchBlueprints = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/blueprints`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const formatted = data.map((b: any) => ({
                        id: b.id,
                        name: b.title || b.name,
                        title: b.title,
                        exam_type: b.exam_type,
                        subject_code: b.subject_code,
                        duration_minutes: b.duration_minutes,
                        sections: (b.sections || []).map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            marksPerQuestion: s.marks_per_question || s.marksPerQuestion || 2,
                            numberOfQuestions: s.number_of_questions || s.numberOfQuestions || 5,
                            totalMarks: (s.marks_per_question || s.marksPerQuestion || 2) * (s.number_of_questions || s.numberOfQuestions || 5),
                            difficulty: s.difficulty,
                            blooms_levels: s.blooms_levels,
                        })),
                    }));
                    setBlueprints(formatted);
                    return;
                }
            }
            setBlueprints(mockBlueprints);
        } catch (err) {
            console.error('Fetch blueprints error:', err);
            setBlueprints(mockBlueprints);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlueprints();
    }, []);

    const updateSection = (id: string, field: keyof ExtendedSection, value: any) => {
        setSections(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                if (field === 'marksPerQuestion' || field === 'numberOfQuestions') {
                    updated.totalMarks = Number(updated.marksPerQuestion || 0) * Number(updated.numberOfQuestions || 0);
                }
                return updated;
            }
            return s;
        }));
    };

    const addSection = () => {
        const id = `s${Date.now()}`;
        setSections(prev => [...prev, {
            id,
            name: `Section ${String.fromCharCode(65 + prev.length)}`,
            marksPerQuestion: 5,
            numberOfQuestions: 4,
            totalMarks: 20,
            difficulty: ['Medium'],
            blooms_levels: ['L2_Understand', 'L3_Apply'],
        }]);
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const grandTotalMarks = sections.reduce((acc, curr) => acc + (Number(curr.marksPerQuestion) * Number(curr.numberOfQuestions)), 0);

    const handleSaveBlueprint = async () => {
        if (!newTitle.trim()) {
            alert('Please enter a blueprint title');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title: newTitle.trim(),
                exam_type: examType,
                subject_code: subjectCode,
                total_marks: grandTotalMarks,
                duration_minutes: durationMinutes,
                sections: sections.map(s => ({
                    id: s.id,
                    name: s.name,
                    marks_per_question: Number(s.marksPerQuestion),
                    number_of_questions: Number(s.numberOfQuestions),
                    total_marks: Number(s.marksPerQuestion) * Number(s.numberOfQuestions),
                    difficulty: s.difficulty,
                    blooms_levels: s.blooms_levels,
                })),
            };

            const res = await fetch(`${BACKEND_URL}/blueprints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchBlueprints();
                setShowBuilder(false);
                setNewTitle('');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message || 'Failed to save blueprint'}`);
            }
        } catch (err) {
            console.error('Save blueprint error:', err);
            // Fallback locally
            const fallbackBp: Blueprint = {
                id: `bp-${Date.now()}`,
                name: newTitle.trim(),
                sections: sections.map(s => ({
                    ...s,
                    totalMarks: Number(s.marksPerQuestion) * Number(s.numberOfQuestions)
                }))
            };
            setBlueprints(prev => [fallbackBp, ...prev]);
            setShowBuilder(false);
            setNewTitle('');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBlueprint = async (id: string) => {
        if (!confirm('Are you sure you want to delete this blueprint?')) return;
        setIsDeleting(id);
        try {
            await fetch(`${BACKEND_URL}/blueprints/${id}`, { method: 'DELETE' });
            setBlueprints(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            console.error(err);
            setBlueprints(prev => prev.filter(b => b.id !== id));
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Examination Blueprints</h2>
                    <p className="text-slate-400 text-sm">
                        Define marking schemes, Bloom's level distributions, and strict structure constraints.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={() => setShowBuilder(!showBuilder)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> {showBuilder ? 'Close Builder' : 'Create Blueprint'}
                    </Button>
                    <Link href="/dashboard/generate">
                        <Button className="bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700">
                            <Sparkles className="w-4 h-4 mr-2 text-amber-400" /> Generate Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Inline Builder Drawer */}
            <AnimatePresence>
                {showBuilder && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-xl shadow-2xl space-y-6"
                    >
                        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                            <div>
                                <h3 className="text-xl font-bold text-white">Define New Blueprint</h3>
                                <p className="text-xs text-slate-400">Configure sections, questions, and mark allocations.</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm px-3 py-1 font-mono">
                                    Total: {grandTotalMarks} Marks
                                </Badge>
                                <Button
                                    onClick={handleSaveBlueprint}
                                    disabled={isSaving}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-9"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Save Blueprint
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-medium text-slate-300">Blueprint Title</label>
                                <Input
                                    placeholder="e.g., Mid-Term Examination Blueprint (50 Marks)"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white h-10 focus-visible:ring-amber-500"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300">Exam Type</label>
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 text-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="Unit_Test_1">Unit Test 1</option>
                                    <option value="Unit_Test_2">Unit Test 2</option>
                                    <option value="In_Sem">In-Sem / Mid-Term</option>
                                    <option value="End_Sem_Final">End-Sem Final Exam</option>
                                </select>
                            </div>
                        </div>

                        {/* Sections List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-slate-300">Sections Configuration</label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addSection}
                                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Section
                                </Button>
                            </div>

                            {sections.map((sec) => (
                                <div key={sec.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                    <div className="md:col-span-5 space-y-1">
                                        <label className="text-[11px] text-slate-500 uppercase font-semibold">Section Name</label>
                                        <Input
                                            value={sec.name}
                                            onChange={(e) => updateSection(sec.id, 'name', e.target.value)}
                                            className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[11px] text-slate-500 uppercase font-semibold">Marks / Q</label>
                                        <Input
                                            type="number"
                                            value={sec.marksPerQuestion}
                                            onChange={(e) => updateSection(sec.id, 'marksPerQuestion', Number(e.target.value))}
                                            className="bg-slate-900 border-slate-700 text-white h-9"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[11px] text-slate-500 uppercase font-semibold">No. of Qs</label>
                                        <Input
                                            type="number"
                                            value={sec.numberOfQuestions}
                                            onChange={(e) => updateSection(sec.id, 'numberOfQuestions', Number(e.target.value))}
                                            className="bg-slate-900 border-slate-700 text-white h-9"
                                        />
                                    </div>
                                    <div className="md:col-span-2 text-right">
                                        <label className="text-[11px] text-slate-500 uppercase font-semibold block">Subtotal</label>
                                        <span className="text-base font-bold text-amber-400 font-mono">
                                            {Number(sec.marksPerQuestion) * Number(sec.numberOfQuestions)} M
                                        </span>
                                    </div>
                                    <div className="md:col-span-1 text-right">
                                        <button
                                            onClick={() => removeSection(sec.id)}
                                            className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blueprints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blueprints.map((bp) => {
                    const totalMarks = bp.sections.reduce((acc, s) => acc + s.totalMarks, 0);
                    const totalQuestions = bp.sections.reduce((acc, s) => acc + s.numberOfQuestions, 0);

                    return (
                        <Card
                            key={bp.id}
                            className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group backdrop-blur-sm shadow-lg"
                        >
                            <CardHeader className="pb-4 border-b border-slate-800/60">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                                            <ClipboardList className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-white group-hover:text-amber-400 transition-colors">
                                                {bp.name}
                                            </CardTitle>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {bp.sections.length} Sections • {totalQuestions} Questions Total
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm font-bold px-2.5 py-1 font-mono">
                                            {totalMarks} Marks
                                        </Badge>
                                        <button
                                            onClick={() => handleDeleteBlueprint(bp.id)}
                                            disabled={isDeleting === bp.id}
                                            className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors"
                                            title="Delete Blueprint"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-4 space-y-4">
                                <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                                    {bp.sections.map((s) => (
                                        <div key={s.id} className="flex justify-between text-xs items-center text-slate-300">
                                            <span className="font-medium text-slate-400">
                                                {s.name} <span className="text-slate-500">({s.numberOfQuestions} × {s.marksPerQuestion}m)</span>
                                            </span>
                                            <span className="font-bold text-amber-400">{s.totalMarks} M</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                                    <span className="text-xs text-slate-500 flex items-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Ready for Generation
                                    </span>
                                    <Link href={`/dashboard/generate?blueprintId=${bp.id}`}>
                                        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-9">
                                            <Sparkles className="w-4 h-4 mr-1.5" /> Use in Paper Generator
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
