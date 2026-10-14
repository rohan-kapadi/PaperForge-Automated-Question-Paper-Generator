'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    ClipboardList, Plus, Sparkles, Trash2, CheckCircle2, Clock, Loader2, 
    GitFork, Layers, Wand2, ArrowRightLeft, BookOpen, AlertCircle, X
} from 'lucide-react';
import { Blueprint, BlueprintSection } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

interface ExtendedSection extends BlueprintSection {
    difficulty?: string[];
    blooms_levels?: string[];
    isOrChoice?: boolean;
    pairedWithId?: string;
    pairLabel?: string;
    subQuestionMarks?: number[];
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
            const res = await apiFetch('/blueprints');
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
                        sections: (b.sections || []).map((s: any) => {
                            const subMarks = s.sub_question_marks || s.subQuestionMarks || (
                                s.marks_per_question && s.number_of_questions
                                    ? Array(Number(s.number_of_questions)).fill(Number(s.marks_per_question))
                                    : [5, 5, 5]
                            );
                            const secTotal = s.total_marks ?? subMarks.reduce((acc: number, m: any) => acc + Number(m || 0), 0);
                            return {
                                id: s.id,
                                name: s.name,
                                marksPerQuestion: s.marks_per_question || s.marksPerQuestion || subMarks[0] || 5,
                                numberOfQuestions: s.number_of_questions || s.numberOfQuestions || subMarks.length,
                                totalMarks: secTotal,
                                subQuestionMarks: subMarks,
                                difficulty: s.difficulty,
                                blooms_levels: s.blooms_levels,
                                isOrChoice: s.is_or_choice || s.isOrChoice || false,
                                pairedWithId: s.paired_with_id || s.pairedWithId,
                                pairLabel: s.pair_label || s.pairLabel,
                            };
                        }),
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

    const getSectionMarksList = (s: ExtendedSection): number[] => {
        if (s.subQuestionMarks && s.subQuestionMarks.length > 0) {
            return s.subQuestionMarks.map(Number);
        }
        const count = Math.max(1, Number(s.numberOfQuestions) || 3);
        const marks = Number(s.marksPerQuestion) || 5;
        return Array(count).fill(marks);
    };

    const getSectionTotalMarks = (s: ExtendedSection): number => {
        const list = getSectionMarksList(s);
        return list.reduce((a, b) => a + Number(b || 0), 0);
    };

    const updateSubQuestionMark = (secId: string, subIdx: number, markVal: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            const currentList = [...getSectionMarksList(s)];
            currentList[subIdx] = Math.max(1, Number(markVal) || 1);
            const newTotal = currentList.reduce((a, b) => a + b, 0);
            return {
                ...s,
                subQuestionMarks: currentList,
                numberOfQuestions: currentList.length,
                marksPerQuestion: currentList[0] || s.marksPerQuestion,
                totalMarks: newTotal,
            };
        }));
    };

    const setSubQuestionMarksFromText = (secId: string, text: string) => {
        const parsed = text
            .split(/[,+\s]+/)
            .map(v => parseInt(v.trim(), 10))
            .filter(v => !isNaN(v) && v > 0);
        
        if (parsed.length === 0) return;

        setSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            const newTotal = parsed.reduce((a, b) => a + b, 0);
            return {
                ...s,
                subQuestionMarks: parsed,
                numberOfQuestions: parsed.length,
                marksPerQuestion: parsed[0] || s.marksPerQuestion,
                totalMarks: newTotal,
            };
        }));
    };

    const addSubQuestionToSection = (secId: string, defaultMark = 5) => {
        setSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            const currentList = [...getSectionMarksList(s), defaultMark];
            const newTotal = currentList.reduce((a, b) => a + b, 0);
            return {
                ...s,
                subQuestionMarks: currentList,
                numberOfQuestions: currentList.length,
                totalMarks: newTotal,
            };
        }));
    };

    const removeSubQuestionFromSection = (secId: string, subIdx: number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== secId) return s;
            const currentList = getSectionMarksList(s).filter((_, idx) => idx !== subIdx);
            if (currentList.length === 0) return s; // Keep at least 1
            const newTotal = currentList.reduce((a, b) => a + b, 0);
            return {
                ...s,
                subQuestionMarks: currentList,
                numberOfQuestions: currentList.length,
                marksPerQuestion: currentList[0] || s.marksPerQuestion,
                totalMarks: newTotal,
            };
        }));
    };

    const updateSection = (id: string, field: keyof ExtendedSection, value: any) => {
        setSections(prev => prev.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                if (field === 'numberOfQuestions') {
                    const newCount = Math.max(1, Number(value) || 1);
                    const currentMarks = getSectionMarksList(s);
                    let newMarks = [...currentMarks];
                    if (newCount > currentMarks.length) {
                        while (newMarks.length < newCount) {
                            newMarks.push(Number(s.marksPerQuestion) || 5);
                        }
                    } else if (newCount < currentMarks.length) {
                        newMarks = newMarks.slice(0, newCount);
                    }
                    updated.subQuestionMarks = newMarks;
                    updated.numberOfQuestions = newCount;
                    updated.totalMarks = newMarks.reduce((a, b) => a + b, 0);
                } else if (field === 'marksPerQuestion') {
                    const newMark = Math.max(1, Number(value) || 1);
                    const newMarks = Array(Number(updated.numberOfQuestions) || 3).fill(newMark);
                    updated.subQuestionMarks = newMarks;
                    updated.marksPerQuestion = newMark;
                    updated.totalMarks = newMarks.reduce((a, b) => a + b, 0);
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
            let updatedSubMarks = current.subQuestionMarks;
            if (willBeOr && index > 0) {
                const prevSec = prev[index - 1];
                pairedId = prevSec.id;
                const cleanPrevName = prevSec.name.replace(/\(.*\)/, '').trim();
                const cleanCurrName = current.name.replace(/\(.*\)/, '').trim();
                pairLabel = `${cleanPrevName || `Q${index}`} OR ${cleanCurrName || `Q${index + 1}`}`;
                // Inherit predecessor subQuestionMarks if current hasn't been modified
                if (!current.subQuestionMarks || current.subQuestionMarks.length === 0) {
                    updatedSubMarks = [...getSectionMarksList(prevSec)];
                }
            }

            return prev.map((s, i) => {
                if (i === index) {
                    const subMarks = updatedSubMarks || getSectionMarksList(s);
                    return {
                        ...s,
                        isOrChoice: willBeOr,
                        pairedWithId: willBeOr ? pairedId : undefined,
                        pairLabel: willBeOr ? pairLabel : undefined,
                        subQuestionMarks: subMarks,
                        numberOfQuestions: subMarks.length,
                        totalMarks: subMarks.reduce((a, b) => a + b, 0),
                    };
                }
                return s;
            });
        });
    };

    const addOrAlternative = (targetIndex: number) => {
        setSections(prev => {
            const target = prev[targetIndex];
            const targetMarksList = [...getSectionMarksList(target)];
            const newSecId = `sec-or-${Date.now()}`;
            const cleanTargetName = target.name.replace(/\(.*\)/, '').trim();
            const newSection: ExtendedSection = {
                id: newSecId,
                name: `${cleanTargetName} (OR Alternative)`,
                marksPerQuestion: targetMarksList[0] || target.marksPerQuestion,
                numberOfQuestions: targetMarksList.length,
                totalMarks: targetMarksList.reduce((a, b) => a + b, 0),
                subQuestionMarks: targetMarksList,
                difficulty: target.difficulty ? [...target.difficulty] : ['Medium'],
                blooms_levels: target.blooms_levels ? [...target.blooms_levels] : ['L2_Understand', 'L3_Apply'],
                isOrChoice: true,
                pairedWithId: target.id,
                pairLabel: `${cleanTargetName} OR Alternative`,
            };
            const copy = [...prev];
            copy.splice(targetIndex + 1, 0, newSection);
            return copy;
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
            subQuestionMarks: [5, 5, 5],
            difficulty: ['Medium'],
            blooms_levels: ['L2_Understand', 'L3_Apply'],
            isOrChoice: false,
        }]);
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    // Computations using cumulative sub-question marks
    const grossTotalMarks = sections.reduce((acc, curr) => acc + getSectionTotalMarks(curr), 0);
    const attemptTotalMarks = sections.reduce((acc, curr) => {
        if (curr.isOrChoice) return acc; // Exclude alternative OR choice from student attempt total
        return acc + getSectionTotalMarks(curr);
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
                sections: sections.map(s => {
                    const subMarks = getSectionMarksList(s);
                    const secTotal = subMarks.reduce((a, b) => a + Number(b || 0), 0);
                    return {
                        id: s.id,
                        name: s.name,
                        marks_per_question: subMarks[0] || Number(s.marksPerQuestion) || 5,
                        number_of_questions: subMarks.length,
                        total_marks: secTotal,
                        sub_question_marks: subMarks,
                        difficulty: s.difficulty,
                        blooms_levels: s.blooms_levels,
                        is_or_choice: !!s.isOrChoice,
                        paired_with_id: s.pairedWithId,
                        pair_label: s.pairLabel,
                    };
                }),
            };

            const res = await apiFetch('/blueprints', {
                method: 'POST',
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
            await apiFetch(`/blueprints/${id}`, { method: 'DELETE' });
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

                            <div className="space-y-1">
                                {sections.map((sec, index) => {
                                    const subMarksList = getSectionMarksList(sec);
                                    const secTotalMarks = getSectionTotalMarks(sec);
                                    const prevSec = index > 0 ? sections[index - 1] : null;

                                    return (
                                        <div key={sec.id} className="space-y-1">
                                            {/* Inter-question OR connector (visible between two questions) */}
                                            {index > 0 && prevSec && (
                                                sec.isOrChoice ? (
                                                    /* Active OR connector */
                                                    <div className="relative py-2 my-1 group/activeOr flex items-center justify-center">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t-2 border-dashed border-purple-500/50" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleOrChoice(sec.id)}
                                                            className="relative group/btn flex items-center space-x-2 px-4 py-1.5 rounded-full bg-purple-950 border border-purple-500/70 text-purple-200 shadow-lg shadow-purple-950/60 hover:bg-red-950/90 hover:border-red-500/70 hover:text-red-200 transition-all cursor-pointer font-bold text-xs"
                                                            title="Click to remove OR choice and make this question compulsory"
                                                        >
                                                            <GitFork className="w-3.5 h-3.5 text-purple-400 group-hover/btn:hidden" />
                                                            <span className="group-hover/btn:hidden font-mono tracking-wider flex items-center">
                                                                ⚡ {sec.pairLabel || `${prevSec.name} OR ${sec.name}`} <span className="ml-1.5 text-[10px] font-normal text-purple-300">(Students Attempt 1)</span>
                                                            </span>
                                                            <span className="hidden group-hover/btn:inline-flex items-center text-red-300">
                                                                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-400" />
                                                                Remove OR Link (Make Separate)
                                                            </span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    /* Hover-revealed OR button between two questions */
                                                    <div className="relative py-2.5 my-0.5 group/orGap">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <div className="w-full border-t border-dashed border-slate-800/60 group-hover/orGap:border-purple-500/50 transition-colors" />
                                                        </div>

                                                        <div className="relative flex justify-center items-center space-x-2 opacity-0 group-hover/orGap:opacity-100 transition-all duration-200 transform scale-95 group-hover/orGap:scale-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleOrChoice(sec.id)}
                                                                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-purple-600 text-slate-300 hover:text-white border border-slate-700 hover:border-purple-400 rounded-full text-xs font-semibold shadow-xl shadow-purple-950/60 transition-all cursor-pointer hover:scale-105"
                                                                title={`Make ${sec.name} an OR alternative to ${prevSec.name}`}
                                                            >
                                                                <GitFork className="w-3.5 h-3.5 text-purple-400 group-hover/orGap:text-white" />
                                                                <span className="font-bold">OR</span>
                                                                <span className="text-[11px] font-normal text-slate-400 group-hover/orGap:text-purple-100">
                                                                    (Pair with {prevSec.name})
                                                                </span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => addOrAlternative(index - 1)}
                                                                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-purple-300 border border-slate-800 hover:border-purple-500/40 rounded-full text-[11px] font-medium shadow-md transition-all cursor-pointer"
                                                                title={`Insert a new alternative question for ${prevSec.name}`}
                                                            >
                                                                <Plus className="w-3 h-3 text-purple-400" />
                                                                <span>Insert New OR</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}

                                            {/* Question / Section Card */}
                                            <div 
                                                className={`p-4 rounded-xl border transition-all ${
                                                    sec.isOrChoice 
                                                        ? 'bg-purple-950/20 border-purple-500/40 ml-3 md:ml-6 shadow-sm border-l-4 border-l-purple-500' 
                                                        : 'bg-slate-950/60 border-slate-800'
                                                }`}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center space-x-2">
                                                        <Badge className={`${
                                                            sec.isOrChoice 
                                                                ? 'bg-purple-500/30 text-purple-200 border-purple-500/50' 
                                                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                                        } text-xs font-mono font-bold flex items-center`}>
                                                            {sec.isOrChoice && <GitFork className="w-3 h-3 mr-1 text-purple-300" />}
                                                            {sec.isOrChoice ? 'OR ALTERNATIVE' : `QUESTION ${index + 1}`}
                                                        </Badge>
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {sec.isOrChoice 
                                                                ? `Alternative to ${prevSec?.name || 'Preceding Question'} (Attempt 1 of 2)` 
                                                                : 'Compulsory Question'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        {sec.isOrChoice ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleOrChoice(sec.id)}
                                                                className="text-xs text-purple-300 hover:text-red-300 flex items-center px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/40 hover:border-red-500/40 transition-colors"
                                                                title="Unlink and make compulsory"
                                                            >
                                                                <Trash2 className="w-3 h-3 mr-1.5" />
                                                                Unlink OR
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => addOrAlternative(index)}
                                                                className="text-xs text-slate-400 hover:text-purple-300 flex items-center px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors"
                                                                title="Add an OR choice question directly below this question"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1 text-purple-400" />
                                                                Add OR Choice
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => removeSection(sec.id)}
                                                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                                            title="Delete Question"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                                    <div className="md:col-span-6 space-y-1">
                                                        <label className="text-[11px] text-slate-400 uppercase font-semibold">Question / Section Name</label>
                                                        <Input
                                                            value={sec.name}
                                                            onChange={(e) => updateSection(sec.id, 'name', e.target.value)}
                                                            placeholder="e.g. Que 1 (A, B, C)"
                                                            className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3 space-y-1">
                                                        <label className="text-[11px] text-slate-400 uppercase font-semibold">No. of Sub-Qs</label>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            value={sec.numberOfQuestions}
                                                            onChange={(e) => updateSection(sec.id, 'numberOfQuestions', Number(e.target.value))}
                                                            className="bg-slate-900 border-slate-700 text-white h-9 text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-3 text-right">
                                                        <label className="text-[11px] text-slate-400 uppercase font-semibold block">Cumulative Marks</label>
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <span className="text-lg font-bold text-amber-400 font-mono">
                                                                {secTotalMarks} M
                                                            </span>
                                                            {sec.isOrChoice && (
                                                                <span className="text-[10px] text-purple-400 font-medium">
                                                                    (Choice Option)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono block">
                                                            ({subMarksList.join(' + ')})
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Sub-Questions Cumulative Marks Breakdown */}
                                                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center space-x-1.5 text-xs">
                                                            <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">Sub-Questions Marks:</span>
                                                            <span className="text-slate-400 text-[11px]">
                                                                (Supports different marks e.g. 4, 5, 5)
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <span className="text-[11px] text-slate-500">Quick set:</span>
                                                            <Input
                                                                defaultValue={subMarksList.join(', ')}
                                                                key={subMarksList.join(',')}
                                                                onBlur={(e) => setSubQuestionMarksFromText(sec.id, e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        setSubQuestionMarksFromText(sec.id, (e.target as HTMLInputElement).value);
                                                                    }
                                                                }}
                                                                placeholder="e.g. 4, 5, 5"
                                                                className="bg-slate-900 border-slate-700 text-amber-300 text-xs h-7 w-28 px-2 font-mono text-center"
                                                                title="Enter comma-separated marks like 4, 5, 5"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {subMarksList.map((mVal, subIdx) => {
                                                            const letter = String.fromCharCode(65 + subIdx);
                                                            return (
                                                                <div 
                                                                    key={subIdx} 
                                                                    className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs space-x-1.5 shadow-sm hover:border-amber-500/50 transition-colors"
                                                                >
                                                                    <span className="font-bold text-slate-300 font-mono">{letter}.</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={mVal}
                                                                        onChange={(e) => updateSubQuestionMark(sec.id, subIdx, Number(e.target.value))}
                                                                        className="w-12 h-6 px-1 text-center bg-slate-950 border-slate-700 text-amber-400 font-bold font-mono text-xs focus-visible:ring-1 focus-visible:ring-amber-500"
                                                                    />
                                                                    <span className="text-slate-500 text-[10px]">M</span>
                                                                    {subMarksList.length > 1 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeSubQuestionFromSection(sec.id, subIdx)}
                                                                            className="text-slate-500 hover:text-red-400 ml-0.5 p-0.5 rounded"
                                                                            title={`Remove Sub-Q ${letter}`}
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        <button
                                                            type="button"
                                                            onClick={() => addSubQuestionToSection(sec.id, 5)}
                                                            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-amber-400 border border-dashed border-slate-700 hover:border-amber-500/60 rounded-lg px-2.5 py-1 transition-colors bg-slate-900/40"
                                                            title="Add another sub-question to this question"
                                                        >
                                                            <Plus className="w-3 h-3 text-amber-400" />
                                                            <span>Add Sub-Q</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {sec.isOrChoice && (
                                                    <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between text-xs text-purple-300 gap-2">
                                                        <div className="flex items-center space-x-1.5">
                                                            <GitFork className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                            <span>
                                                                Paired with <strong>{prevSec?.name || 'Preceding Question'}</strong> • Students attempt either one.
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-slate-400">Label:</span>
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
                                        {bp.sections.map((s) => {
                                            const sqMarks = s.subQuestionMarks;
                                            const hasDifferentMarks = sqMarks && sqMarks.length > 0 && !sqMarks.every((m: any) => Number(m) === Number(sqMarks[0]));
                                            return (
                                                <div key={s.id} className="flex justify-between text-xs items-center text-slate-300">
                                                    <span className={`font-medium ${s.isOrChoice ? 'text-purple-300 pl-3 border-l-2 border-purple-500/50' : 'text-slate-400'}`}>
                                                        {s.isOrChoice && <span className="font-bold text-purple-400 mr-1.5">OR</span>}
                                                        {s.name} <span className="text-slate-500">
                                                            {hasDifferentMarks
                                                                ? `(${sqMarks!.join(' + ')}m)`
                                                                : `(${s.numberOfQuestions} × ${s.marksPerQuestion}m)`}
                                                        </span>
                                                    </span>
                                                    <span className="font-bold text-amber-400">{s.totalMarks} M</span>
                                                </div>
                                            );
                                        })}
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
