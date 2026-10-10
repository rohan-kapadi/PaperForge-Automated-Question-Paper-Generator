'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    ClipboardList, Plus, Sparkles, Trash2, CheckCircle2, Clock, Loader2, 
    GitFork, Layers, Wand2, ArrowRightLeft, BookOpen, AlertCircle 
} from 'lucide-react';
import { Blueprint, BlueprintSection } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExtendedSection extends BlueprintSection {
    difficulty?: string[];
    blooms_levels?: string[];
    isOrChoice?: boolean;
    pairedWithId?: string;
    pairLabel?: string;
}

export default function BlueprintsPage() {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showBuilder, setShowBuilder] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const [newTitle, setNewTitle] = useState('');
    const [examType, setExamType] = useState('Unit_Test_1');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [subjectCode, setSubjectCode] = useState('ENG-301');
    const [sections, setSections] = useState<ExtendedSection[]>([
        {
            id: 'sec-q1',
            name: 'Que 1 (Compulsory)',
            marksPerQuestion: 5,
            numberOfQuestions: 3,
            totalMarks: 15,
            difficulty: ['Medium'],
            blooms_levels: ['L2_Understand', 'L3_Apply'],
            isOrChoice: false,
        },
        {
            id: 'sec-q2',
            name: 'Que 2 (OR Alternative)',
            marksPerQuestion: 5,
            numberOfQuestions: 3,
            totalMarks: 15,
            difficulty: ['Medium'],
            blooms_levels: ['L2_Understand', 'L3_Apply'],
            isOrChoice: true,
            pairedWithId: 'sec-q1',
            pairLabel: 'Q1 OR Q2',
        },
        {
            id: 'sec-q3',
            name: 'Que 3 (Compulsory)',
            marksPerQuestion: 5,
            numberOfQuestions: 3,
            totalMarks: 15,
            difficulty: ['Medium', 'Hard'],
            blooms_levels: ['L3_Apply', 'L4_Analyze'],
            isOrChoice: false,
        },
        {
            id: 'sec-q4',
            name: 'Que 4 (OR Alternative)',
            marksPerQuestion: 5,
            numberOfQuestions: 3,
            totalMarks: 15,
            difficulty: ['Medium', 'Hard'],
            blooms_levels: ['L3_Apply', 'L4_Analyze'],
            isOrChoice: true,
            pairedWithId: 'sec-q3',
            pairLabel: 'Q3 OR Q4',
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
                        total_marks: b.total_marks,
                        totalMarks: b.total_marks,
                        attempt_marks: b.attempt_marks || b.total_marks,
                        gross_marks: b.gross_marks || b.total_marks,
                        has_or_choices: b.has_or_choices ?? (b.sections || []).some((s: any) => s.is_or_choice || s.isOrChoice),
                        sections: (b.sections || []).map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            marksPerQuestion: s.marks_per_question || s.marksPerQuestion || 5,
                            numberOfQuestions: s.number_of_questions || s.numberOfQuestions || 3,
                            totalMarks: (s.marks_per_question || s.marksPerQuestion || 5) * (s.number_of_questions || s.numberOfQuestions || 3),
                            difficulty: s.difficulty,
                            blooms_levels: s.blooms_levels,
                            isOrChoice: s.is_or_choice || s.isOrChoice || false,
                            pairedWithId: s.paired_with_id || s.pairedWithId,
                            pairLabel: s.pair_label || s.pairLabel,
                        })),
                    }));
                    setBlueprints(formatted);
                    return;
                }
            }
            setBlueprints([]);
        } catch (err) {
            console.error('Fetch blueprints error:', err);
            setBlueprints([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBlueprints();
    }, []);

    // Preset Loaders
    const loadPccoerPreset = () => {
        setNewTitle('PCCOER Autonomous Unit Test (30 Marks)');
        setExamType('Unit_Test_1');
        setDurationMinutes(60);
        setSubjectCode('ENG-301');
        setSections([
            {
                id: 'sec-q1',
                name: 'Que 1 (Compulsory)',
                marksPerQuestion: 5,
                numberOfQuestions: 3,
                totalMarks: 15,
                difficulty: ['Medium'],
                blooms_levels: ['L2_Understand', 'L3_Apply'],
                isOrChoice: false,
            },
            {
                id: 'sec-q2',
                name: 'Que 2 (OR Alternative to Q1)',
                marksPerQuestion: 5,
                numberOfQuestions: 3,
                totalMarks: 15,
                difficulty: ['Medium'],
                blooms_levels: ['L2_Understand', 'L3_Apply'],
                isOrChoice: true,
                pairedWithId: 'sec-q1',
                pairLabel: 'Q1 OR Q2',
            },
            {
                id: 'sec-q3',
                name: 'Que 3 (Compulsory)',
                marksPerQuestion: 5,
                numberOfQuestions: 3,
                totalMarks: 15,
                difficulty: ['Medium', 'Hard'],
                blooms_levels: ['L3_Apply', 'L4_Analyze'],
                isOrChoice: false,
            },
            {
                id: 'sec-q4',
                name: 'Que 4 (OR Alternative to Q3)',
                marksPerQuestion: 5,
                numberOfQuestions: 3,
                totalMarks: 15,
                difficulty: ['Medium', 'Hard'],
                blooms_levels: ['L3_Apply', 'L4_Analyze'],
                isOrChoice: true,
                pairedWithId: 'sec-q3',
                pairLabel: 'Q3 OR Q4',
            },
        ]);
    };

    const loadStandardMidTermPreset = () => {
        setNewTitle('Mid-Term Examination Blueprint (50 Marks)');
        setExamType('In_Sem');
        setDurationMinutes(90);
        setSubjectCode('ENG-202');
        setSections([
            {
                id: 's1',
                name: 'Part A (Objective / Short Answer)',
                marksPerQuestion: 2,
                numberOfQuestions: 10,
                totalMarks: 20,
                difficulty: ['Easy', 'Medium'],
                blooms_levels: ['L1_Remember', 'L2_Understand'],
                isOrChoice: false,
            },
            {
                id: 's2',
                name: 'Part B (Analytical / Descriptive)',
                marksPerQuestion: 6,
                numberOfQuestions: 5,
                totalMarks: 30,
                difficulty: ['Medium', 'Hard'],
                blooms_levels: ['L3_Apply', 'L4_Analyze'],
                isOrChoice: false,
            },
        ]);
    };

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

    const toggleOrChoice = (id: string) => {
        setSections(prev => {
            const index = prev.findIndex(s => s.id === id);
            if (index === -1) return prev;
            const current = prev[index];
            const willBeOr = !current.isOrChoice;
            
            // If turning on OR choice, automatically pair with immediate predecessor if available
            let pairedId = current.pairedWithId;
            let pairLabel = current.pairLabel;
            if (willBeOr && index > 0) {
                const prevSec = prev[index - 1];
                pairedId = prevSec.id;
                pairLabel = `${prevSec.name} OR ${current.name}`;
            }

            return prev.map((s, i) => {
                if (i === index) {
                    return {
                        ...s,
                        isOrChoice: willBeOr,
                        pairedWithId: willBeOr ? pairedId : undefined,
                        pairLabel: willBeOr ? pairLabel : undefined,
                    };
                }
                return s;
            });
        });
    };

    const addSection = () => {
        const id = `s${Date.now()}`;
        setSections(prev => [...prev, {
            id,
            name: `Section ${String.fromCharCode(65 + prev.length)}`,
            marksPerQuestion: 5,
            numberOfQuestions: 3,
            totalMarks: 15,
            difficulty: ['Medium'],
            blooms_levels: ['L2_Understand', 'L3_Apply'],
            isOrChoice: false,
        }]);
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    // Computations
    const grossTotalMarks = sections.reduce((acc, curr) => acc + (Number(curr.marksPerQuestion || 0) * Number(curr.numberOfQuestions || 0)), 0);
    const attemptTotalMarks = sections.reduce((acc, curr) => {
        if (curr.isOrChoice) return acc; // Exclude alternative OR choice from student attempt total
        return acc + (Number(curr.marksPerQuestion || 0) * Number(curr.numberOfQuestions || 0));
    }, 0);
    const hasOrChoices = sections.some(s => s.isOrChoice);

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
                total_marks: hasOrChoices ? attemptTotalMarks : grossTotalMarks,
                duration_minutes: durationMinutes,
                has_or_choices: hasOrChoices,
                attempt_marks: attemptTotalMarks,
                gross_marks: grossTotalMarks,
                sections: sections.map(s => ({
                    id: s.id,
                    name: s.name,
                    marks_per_question: Number(s.marksPerQuestion),
                    number_of_questions: Number(s.numberOfQuestions),
                    total_marks: Number(s.marksPerQuestion) * Number(s.numberOfQuestions),
                    difficulty: s.difficulty,
                    blooms_levels: s.blooms_levels,
                    is_or_choice: !!s.isOrChoice,
                    paired_with_id: s.pairedWithId,
                    pair_label: s.pairLabel,
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
        } catch (err: any) {
            console.error('Save blueprint error:', err);
            alert(`Network error saving blueprint: ${err.message || 'Please verify the backend server is reachable.'}`);
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
                        Define marking schemes, Autonomous OR-choice pairing rules, and strict cognitive constraints.
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
                        {/* Drawer Top Bar */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className="text-xl font-bold text-white">Define New Blueprint</h3>
                                    {hasOrChoices && (
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                                            <GitFork className="w-3 h-3 mr-1" /> Autonomous OR Pairs Active
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Configure sections, OR choice pairings, and mark allocations.
                                </p>
                            </div>
                            <div className="flex items-center flex-wrap gap-2">
                                <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Student Attempt</span>
                                        <span className="text-sm font-bold text-emerald-400 font-mono">{attemptTotalMarks} Marks</span>
                                    </div>
                                    <span className="text-slate-600">/</span>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Gross Paper</span>
                                        <span className="text-sm font-bold text-amber-400 font-mono">{grossTotalMarks} Marks</span>
                                    </div>
                                </div>
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

                        {/* Quick Presets Toolbar */}
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 text-xs text-slate-400">
                                <Wand2 className="w-4 h-4 text-amber-400" />
                                <span className="font-semibold text-slate-300">Quick Templates:</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={loadPccoerPreset}
                                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs h-8"
                                >
                                    <GitFork className="w-3.5 h-3.5 mr-1 text-purple-400" />
                                    PCCOER Autonomous UT (30M: Q1 OR Q2, Q3 OR Q4)
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={loadStandardMidTermPreset}
                                    className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs h-8"
                                >
                                    <Layers className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                    Standard Mid-Term (50M: Part A + Part B)
                                </Button>
                            </div>
                        </div>

                        {/* Meta Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-xs font-medium text-slate-300">Blueprint Title</label>
                                <Input
                                    placeholder="e.g., PCCOER Autonomous Unit Test (30 Marks)"
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
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-300">Duration (Minutes)</label>
                                <Input
                                    type="number"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                    className="bg-slate-950 border-slate-800 text-white h-10 focus-visible:ring-amber-500"
                                />
                            </div>
                        </div>

                        {/* Sections List */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <label className="text-sm font-semibold text-white">Sections Configuration</label>
                                    <p className="text-xs text-slate-400">Mark questions as OR Alternative to configure choice pairing without inflating attempt marks.</p>
                                </div>
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

                            <div className="space-y-3">
                                {sections.map((sec, index) => {
                                    const subtotal = Number(sec.marksPerQuestion || 0) * Number(sec.numberOfQuestions || 0);
                                    return (
                                        <div 
                                            key={sec.id} 
                                            className={`p-4 rounded-xl border transition-all ${
                                                sec.isOrChoice 
                                                    ? 'bg-purple-950/20 border-purple-500/40 ml-4 md:ml-6 shadow-sm' 
                                                    : 'bg-slate-950/60 border-slate-800'
                                            }`}
                                        >
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Badge className={`${
                                                        sec.isOrChoice 
                                                            ? 'bg-purple-500/30 text-purple-300 border-purple-500/50' 
                                                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                    } text-xs font-mono font-bold`}>
                                                        {sec.isOrChoice ? 'OR CHOICE' : `SECTION ${index + 1}`}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {sec.isOrChoice ? 'Alternative Option (Attempt 1 of 2)' : 'Compulsory Section'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => toggleOrChoice(sec.id)}
                                                        className={`text-xs h-7 px-2.5 rounded-lg border ${
                                                            sec.isOrChoice
                                                                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                                                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <ArrowRightLeft className="w-3 h-3 mr-1.5" />
                                                        {sec.isOrChoice ? 'Paired OR Choice' : 'Make OR Alternative'}
                                                    </Button>
                                                    <button
                                                        onClick={() => removeSection(sec.id)}
                                                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                                <div className="md:col-span-5 space-y-1">
                                                    <label className="text-[11px] text-slate-400 uppercase font-semibold">Section Name</label>
                                                    <Input
                                                        value={sec.name}
                                                        onChange={(e) => updateSection(sec.id, 'name', e.target.value)}
                                                        placeholder="e.g. Que 1 (A, B, C)"
                                                        className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className="text-[11px] text-slate-400 uppercase font-semibold">Marks / Sub-Q</label>
                                                    <Input
                                                        type="number"
                                                        value={sec.marksPerQuestion}
                                                        onChange={(e) => updateSection(sec.id, 'marksPerQuestion', Number(e.target.value))}
                                                        className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className="text-[11px] text-slate-400 uppercase font-semibold">No. of Sub-Qs</label>
                                                    <Input
                                                        type="number"
                                                        value={sec.numberOfQuestions}
                                                        onChange={(e) => updateSection(sec.id, 'numberOfQuestions', Number(e.target.value))}
                                                        className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                                    />
                                                </div>
                                                <div className="md:col-span-3 text-right">
                                                    <label className="text-[11px] text-slate-400 uppercase font-semibold block">Section Marks</label>
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <span className="text-base font-bold text-amber-400 font-mono">
                                                            {subtotal} M
                                                        </span>
                                                        {sec.isOrChoice && (
                                                            <span className="text-[10px] text-purple-400 font-medium">
                                                                (Choice Opt)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {sec.isOrChoice && (
                                                <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between text-xs text-purple-300 gap-2">
                                                    <div className="flex items-center space-x-1.5">
                                                        <GitFork className="w-3.5 h-3.5 text-purple-400" />
                                                        <span>
                                                            Mirrored Cognitive Alternative to preceding section. Students answer either option.
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-slate-400">Pair Label:</span>
                                                        <Input
                                                            value={sec.pairLabel || ''}
                                                            onChange={(e) => updateSection(sec.id, 'pairLabel', e.target.value)}
                                                            placeholder="e.g. Q1 OR Q2"
                                                            className="bg-slate-900 border-purple-500/40 text-purple-200 h-7 text-xs w-28 px-2"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blueprints Grid */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Loading blueprints...</p>
                </div>
            ) : blueprints.length === 0 ? (
                <div className="py-16 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-900/40 p-8 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">No blueprints found</h3>
                        <p className="text-sm text-slate-400 max-w-md mx-auto">
                            Examination blueprints define your section rules, Autonomous OR-pairing constraints, and Bloom&apos;s criteria.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Button
                            onClick={() => {
                                loadPccoerPreset();
                                setShowBuilder(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create Autonomous Blueprint
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {blueprints.map((bp) => {
                        const attemptMarks = bp.attempt_marks || bp.total_marks;
                        const grossMarks = bp.gross_marks || bp.total_marks;
                        const totalQuestions = bp.sections.reduce((acc: number, s: any) => acc + (s.numberOfQuestions || 0), 0);

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
                                                <div className="flex items-center space-x-2">
                                                    <CardTitle className="text-lg text-white group-hover:text-amber-400 transition-colors">
                                                        {bp.name}
                                                    </CardTitle>
                                                    {bp.has_or_choices && (
                                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] font-semibold">
                                                            <GitFork className="w-3 h-3 mr-1" /> OR Choice
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {bp.sections.length} Sections • {totalQuestions} Sub-Questions Total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-sm font-bold px-2.5 py-1 font-mono">
                                                {attemptMarks} M
                                                {bp.has_or_choices && (
                                                    <span className="text-[10px] text-slate-400 ml-1 font-normal">
                                                        ({grossMarks}M gross)
                                                    </span>
                                                )}
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
                                                <span className={`font-medium ${s.isOrChoice ? 'text-purple-300 pl-3 border-l-2 border-purple-500/50' : 'text-slate-400'}`}>
                                                    {s.isOrChoice && <span className="font-bold text-purple-400 mr-1.5">OR</span>}
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
            )}
        </div>
    );
}
