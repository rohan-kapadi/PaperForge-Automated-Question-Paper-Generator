'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Database,
    ClipboardList,
    Sliders,
    Eye,
    Save,
    Printer,
    Download,
    Upload,
    Search,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    RefreshCw,
    Edit3,
    Trash2,
    Plus,
    X,
    Loader2,
    FileSpreadsheet,
    FileText,
    Check,
    CloudUpload
} from 'lucide-react';
import { mockQuestions, mockBlueprints, Blueprint, Question as MockQuestion, mockGeneratedPapers } from '@/lib/mockData';
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

interface PaperSectionQuestion {
    id: string;
    text: string;
    marks: number;
    difficulty?: string;
    topic?: string;
    blooms_level?: string;
}

interface PaperSection {
    id: string;
    name: string;
    marksPerQuestion: number;
    targetCount: number;
    questions: PaperSectionQuestion[];
}

function GeneratePaperContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const paramBankId = searchParams.get('bankId');
    const paramBlueprintId = searchParams.get('blueprintId');
    const paramSubject = searchParams.get('subject');

    // Stepper: 1: Source, 2: Blueprint, 3: Configure, 4: Generate, 5: Review, 6: Export
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

    // Step 1: Question Banks
    const [banks, setBanks] = useState<QuestionBank[]>([]);
    const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
    const [bankSearch, setBankSearch] = useState('');
    const [isLoadingBanks, setIsLoadingBanks] = useState(true);
    const [showUploadInStep1, setShowUploadInStep1] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    // Step 2: Blueprints
    const [blueprints, setBlueprints] = useState<Blueprint[]>(mockBlueprints);
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
    const [blueprintMode, setBlueprintMode] = useState<'existing' | 'create' | 'ai'>('existing');
    const [newBpTitle, setNewBpTitle] = useState('');
    const [newBpSections, setNewBpSections] = useState([
        { id: 's1', name: 'Part A (MCQ / Short)', marksPerQuestion: 2, numberOfQuestions: 10, totalMarks: 20 },
        { id: 's2', name: 'Part B (Long Answer)', marksPerQuestion: 6, numberOfQuestions: 5, totalMarks: 30 },
    ]);
    const [aiMarksInput, setAiMarksInput] = useState('50');

    // Step 3: Configure
    const [examName, setExamName] = useState('Mid-Term Examination');
    const [subjectName, setSubjectName] = useState('Database Management Systems');
    const [duration, setDuration] = useState('90');
    const [difficulty, setDifficulty] = useState<'Balanced' | 'Easy' | 'Moderate' | 'Challenging'>('Balanced');
    const [selectedUnits, setSelectedUnits] = useState<string[]>(['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4']);
    const [selectedBlooms, setSelectedBlooms] = useState<string[]>(['Understand', 'Apply', 'Analyze']);

    // Step 4 & 5: Generation & Review
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generationStatusText, setGenerationStatusText] = useState('');
    const [paperSections, setPaperSections] = useState<PaperSection[]>([]);
    const [allAvailableQuestions, setAllAvailableQuestions] = useState<MockQuestion[]>([]);

    // Replacement Modal in Step 5
    const [replaceModal, setReplaceModal] = useState<{
        isOpen: boolean;
        sectionIndex: number;
        questionIndex: number;
        currentQuestion: PaperSectionQuestion | null;
    }>({ isOpen: false, sectionIndex: -1, questionIndex: -1, currentQuestion: null });
    const [replaceSearch, setReplaceSearch] = useState('');
    const [replaceDiffFilter, setReplaceDiffFilter] = useState('all');

    // Inline Edit in Step 5
    const [editingQuestion, setEditingQuestion] = useState<{
        sectionIndex: number;
        questionIndex: number;
        text: string;
        marks: number;
    } | null>(null);

    // Step 6: Save & Export
    const [isSaved, setIsSaved] = useState(false);
    const [generatedPaperId, setGeneratedPaperId] = useState<string | null>(null);
    const [generationWarnings, setGenerationWarnings] = useState<string[]>([]);
    const [candidateQuestions, setCandidateQuestions] = useState<any[]>([]);
    const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

    // Initial Data Fetching
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [resBanks, resQuestions, resBlueprints] = await Promise.all([
                    fetch(`${BACKEND_URL}/questions/banks`).catch(() => null),
                    fetch(`${BACKEND_URL}/questions`).catch(() => null),
                    fetch(`${BACKEND_URL}/blueprints`).catch(() => null),
                ]);

                if (resBanks && resBanks.ok) {
                    const data = await resBanks.json();
                    setBanks(data);
                    if (paramBankId) {
                        const found = data.find((b: any) => b.id === paramBankId);
                        if (found) setSelectedBank(found);
                    }
                } else {
                    // Fallback initial bank
                    setBanks([
                        { id: 'b1', name: 'DBMS_Comprehensive_Question_Bank.xlsx', subject: 'Database Management Systems', file_type: 'XLSX', questions_count: 324 },
                        { id: 'b2', name: 'Operating_Systems_Question_Bank.pdf', subject: 'Operating Systems', file_type: 'PDF', questions_count: 281 },
                        { id: 'b3', name: 'Computer_Networks_Unit_Tests.docx', subject: 'Computer Networks', file_type: 'DOCX', questions_count: 198 }
                    ]);
                }

                if (resBlueprints && resBlueprints.ok) {
                    const bpData = await resBlueprints.json();
                    if (bpData && bpData.length > 0) {
                        const formattedBps = bpData.map((b: any) => ({
                            id: b.id,
                            name: b.title || b.name,
                            sections: (b.sections || []).map((s: any) => ({
                                id: s.id,
                                name: s.name,
                                marksPerQuestion: s.marks_per_question || s.marksPerQuestion || 2,
                                numberOfQuestions: s.number_of_questions || s.numberOfQuestions || 5,
                                totalMarks: (s.marks_per_question || s.marksPerQuestion || 2) * (s.number_of_questions || s.numberOfQuestions || 5),
                            })),
                        }));
                        setBlueprints(formattedBps);
                    }
                }

                if (resQuestions && resQuestions.ok) {
                    const data = await resQuestions.json();
                    if (data && data.length > 0) {
                        const formatted = data.map((q: any) => ({
                            id: q.id,
                            text: q.question_text || q.text,
                            marks: q.marks || 5,
                            unit: q.topic || 'Unit 1',
                            difficulty: (q.difficulty as any) || 'Medium',
                            topic: q.subject || 'General'
                        }));
                        setAllAvailableQuestions(formatted);
                    } else {
                        setAllAvailableQuestions(mockQuestions);
                    }
                } else {
                    setAllAvailableQuestions(mockQuestions);
                }
            } catch (err) {
                console.error(err);
                setAllAvailableQuestions(mockQuestions);
            } finally {
                setIsLoadingBanks(false);
            }
        };

        fetchInitialData();
    }, [paramBankId]);

    // Handle param blueprint
    useEffect(() => {
        if (paramBlueprintId) {
            const bp = blueprints.find(b => b.id === paramBlueprintId);
            if (bp) {
                setSelectedBlueprint(bp);
                // If bank was also selected, jump to configure
                if (selectedBank) setStep(3);
            }
        }
        if (paramSubject) {
            setSubjectName(decodeURIComponent(paramSubject));
        }
    }, [paramBlueprintId, paramSubject, blueprints, selectedBank]);

    // Smart Recommendation detection
    const getRecommendedBlueprint = () => {
        if (!selectedBank) return null;
        const sub = (selectedBank.subject || selectedBank.name).toLowerCase();
        return blueprints.find(bp => {
            const bpName = bp.name.toLowerCase();
            return (sub.includes('dbms') && bpName.includes('mid-term')) ||
                   (sub.includes('operat') && bpName.includes('end-term')) ||
                   bpName.includes(sub);
        }) || blueprints[0];
    };

    const recommendedBp = selectedBank ? getRecommendedBlueprint() : null;

    // Handle Upload inside Step 1
    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);

            const res = await fetch(`${BACKEND_URL}/questions/upload`, {
                method: 'POST',
                body: form
            });

            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();

            const newBank: QuestionBank = {
                id: data.bankId || `b-${Date.now()}`,
                name: file.name,
                subject: subjectName || 'General',
                file_type: file.name.split('.').pop()?.toUpperCase(),
                questions_count: data.total || 0,
                created_at: new Date().toISOString()
            };

            setBanks(prev => [newBank, ...prev]);
            setSelectedBank(newBank);
            setShowUploadInStep1(false);
        } catch (err) {
            console.error(err);
            // Local fallback simulation if backend is offline
            const fallbackBank: QuestionBank = {
                id: `b-local-${Date.now()}`,
                name: file.name,
                subject: subjectName || 'General',
                file_type: file.name.split('.').pop()?.toUpperCase(),
                questions_count: 24,
                created_at: new Date().toISOString()
            };
            setBanks(prev => [fallbackBank, ...prev]);
            setSelectedBank(fallbackBank);
            setShowUploadInStep1(false);
        } finally {
            setIsUploading(false);
        }
    };

    // AI Create Blueprint generator
    const handleGenerateAiBlueprint = () => {
        const total = parseInt(aiMarksInput) || 50;
        let generatedSections = [];

        if (total <= 30) {
            // Unit Test pattern
            generatedSections = [
                { id: 's1', name: 'Section A - Short Answer Questions', marksPerQuestion: 2, numberOfQuestions: 5, totalMarks: 10 },
                { id: 's2', name: 'Section B - Problem Solving / Descriptive', marksPerQuestion: 5, numberOfQuestions: 4, totalMarks: 20 },
            ];
        } else if (total <= 60) {
            // Mid Term pattern
            generatedSections = [
                { id: 's1', name: 'Section A - Multiple Choice & Definitions', marksPerQuestion: 2, numberOfQuestions: 5, totalMarks: 10 },
                { id: 's2', name: 'Section B - Conceptual & Explanatory', marksPerQuestion: 5, numberOfQuestions: 4, totalMarks: 20 },
                { id: 's3', name: 'Section C - Analytical / Design Problems', marksPerQuestion: 10, numberOfQuestions: 2, totalMarks: 20 },
            ];
        } else {
            // Final Exam pattern (70-100 marks)
            generatedSections = [
                { id: 's1', name: 'Section A - Compulsory Objective Questions', marksPerQuestion: 2, numberOfQuestions: 10, totalMarks: 20 },
                { id: 's2', name: 'Section B - Short Engineering Explanations', marksPerQuestion: 5, numberOfQuestions: 6, totalMarks: 30 },
                { id: 's3', name: 'Section C - Comprehensive Derivations & Problems', marksPerQuestion: 10, numberOfQuestions: 5, totalMarks: 50 },
            ];
        }

        const newBp: Blueprint = {
            id: `bp-ai-${Date.now()}`,
            name: `AI Optimized ${total}M Blueprint`,
            sections: generatedSections
        };

        setBlueprints(prev => [newBp, ...prev]);
        setSelectedBlueprint(newBp);
        setBlueprintMode('existing');
    };

    // Blueprint total marks
    const targetBlueprintMarks = selectedBlueprint
        ? selectedBlueprint.sections.reduce((acc, s) => acc + s.totalMarks, 0)
        : 50;

    // Step 4: Run Paper Generation
    const executeGeneration = async () => {
        setIsGenerating(true);
        setGenerationProgress(15);
        setGenerationStatusText('Selecting questions from source question bank...');

        setTimeout(() => {
            setGenerationProgress(45);
            setGenerationStatusText('Balancing difficulty ratios (30% Easy, 50% Medium, 20% Hard)...');
        }, 500);

        setTimeout(() => {
            setGenerationProgress(75);
            setGenerationStatusText('Allocating marks according to blueprint section constraints...');
        }, 1000);

        // Attempt Real Backend Generation
        try {
            const payload: any = {
                title: `${subjectName} - ${examName}`,
                difficulty_preset: difficulty,
                selected_units: selectedUnits,
                selected_blooms: selectedBlooms,
            };

            if (selectedBlueprint) {
                if (!selectedBlueprint.id.startsWith('bp-') && !selectedBlueprint.id.startsWith('bp_')) {
                    payload.blueprint_id = selectedBlueprint.id;
                } else {
                    payload.blueprint = {
                        id: selectedBlueprint.id,
                        title: selectedBlueprint.name,
                        sections: selectedBlueprint.sections.map(s => ({
                            id: s.id,
                            name: s.name,
                            marks_per_question: s.marksPerQuestion,
                            number_of_questions: s.numberOfQuestions,
                            total_marks: s.totalMarks,
                        }))
                    };
                }
            }

            if (selectedBank && !selectedBank.id.startsWith('b-local-') && !selectedBank.id.startsWith('b1') && !selectedBank.id.startsWith('b2') && !selectedBank.id.startsWith('b3')) {
                payload.bank_id = selectedBank.id;
            }

            const res = await fetch(`${BACKEND_URL}/papers/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const data = await res.json();
                setGeneratedPaperId(data.id);
                setPaperSections(data.sections || []);
                setGenerationWarnings(data.validation?.warnings || []);
                setGenerationProgress(100);
                setGenerationStatusText('Paper generation complete!');
                setIsGenerating(false);
                setStep(5);
                return;
            }
        } catch (apiErr) {
            console.warn('Real backend generation unavailable or errored; using local generator:', apiErr);
        }

        // Local fallback synthesis
        setTimeout(() => {
            const sourcePool = allAvailableQuestions.length > 0 ? allAvailableQuestions : mockQuestions;
            const sectionsToBuild = selectedBlueprint?.sections || [
                { id: 's1', name: 'Section A - Short Answer', marksPerQuestion: 3, numberOfQuestions: 5, totalMarks: 15 },
                { id: 's2', name: 'Section B - Long Answer', marksPerQuestion: 7, numberOfQuestions: 3, totalMarks: 21 },
            ];

            const assembled: PaperSection[] = sectionsToBuild.map((sec, secIdx) => {
                const matchingQuestions = sourcePool.filter(q => {
                    return q.marks === sec.marksPerQuestion || Math.abs(q.marks - sec.marksPerQuestion) <= 2;
                });

                const pool = matchingQuestions.length >= sec.numberOfQuestions
                    ? matchingQuestions
                    : sourcePool;

                const picked = pool
                    .slice(secIdx * 4, secIdx * 4 + sec.numberOfQuestions)
                    .map((q, qIdx) => ({
                        id: q.id || `q-${secIdx}-${qIdx}`,
                        text: q.text,
                        marks: sec.marksPerQuestion,
                        difficulty: q.difficulty || (qIdx % 2 === 0 ? 'Medium' : 'Easy'),
                        topic: q.unit || `Unit ${(qIdx % 4) + 1}`,
                        blooms_level: qIdx % 3 === 0 ? 'Apply' : qIdx % 3 === 1 ? 'Analyze' : 'Understand'
                    }));

                return {
                    id: sec.id,
                    name: sec.name,
                    marksPerQuestion: sec.marksPerQuestion,
                    targetCount: sec.numberOfQuestions,
                    questions: picked
                };
            });

            setPaperSections(assembled);
            setIsGenerating(false);
            setStep(5);
        }, 1500);
    };

    // Calculate current total marks in generated paper
    const currentTotalMarks = paperSections.reduce((acc, sec) => {
        return acc + sec.questions.reduce((sAcc, q) => sAcc + (Number(q.marks) || 0), 0);
    }, 0);

    // Contextual Actions in Step 5: Replace Question
    const handleOpenReplaceModal = (sectionIndex: number, questionIndex: number) => {
        const currentQ = paperSections[sectionIndex]?.questions[questionIndex] || null;
        setReplaceModal({
            isOpen: true,
            sectionIndex,
            questionIndex,
            currentQuestion: currentQ
        });
        setReplaceSearch('');
        setReplaceDiffFilter('all');
    };

    const handleConfirmReplacement = (replacement: MockQuestion) => {
        if (replaceModal.sectionIndex === -1 || replaceModal.questionIndex === -1) return;

        setPaperSections(prev => {
            const next = [...prev];
            const sec = { ...next[replaceModal.sectionIndex] };
            const qList = [...sec.questions];

            qList[replaceModal.questionIndex] = {
                id: replacement.id,
                text: replacement.text,
                marks: sec.marksPerQuestion,
                difficulty: replacement.difficulty,
                topic: replacement.unit || replacement.topic,
                blooms_level: 'Apply'
            };

            sec.questions = qList;
            next[replaceModal.sectionIndex] = sec;
            return next;
        });

        setReplaceModal({ isOpen: false, sectionIndex: -1, questionIndex: -1, currentQuestion: null });
    };

    // Remove Question
    const handleRemoveQuestion = (sectionIndex: number, questionIndex: number) => {
        setPaperSections(prev => {
            const next = [...prev];
            const sec = { ...next[sectionIndex] };
            sec.questions = sec.questions.filter((_, idx) => idx !== questionIndex);
            next[sectionIndex] = sec;
            return next;
        });
    };

    // Regenerate individual question
    const handleRegenerateQuestion = (sectionIndex: number, questionIndex: number) => {
        const sec = paperSections[sectionIndex];
        const candidates = allAvailableQuestions.filter(q =>
            !sec.questions.some(sq => sq.text === q.text)
        );
        const randomChoice = candidates[Math.floor(Math.random() * candidates.length)] || mockQuestions[0];

        setPaperSections(prev => {
            const next = [...prev];
            const targetSec = { ...next[sectionIndex] };
            const qList = [...targetSec.questions];
            qList[questionIndex] = {
                id: randomChoice.id,
                text: randomChoice.text,
                marks: targetSec.marksPerQuestion,
                difficulty: randomChoice.difficulty,
                topic: randomChoice.unit,
                blooms_level: 'Analyze'
            };
            targetSec.questions = qList;
            next[sectionIndex] = targetSec;
            return next;
        });
    };

    // Auto-fix blueprint mismatches
    const handleAutoFixValidation = () => {
        setPaperSections(prev => {
            return prev.map((sec, secIdx) => {
                const diff = sec.targetCount - sec.questions.length;
                if (diff <= 0) return sec;

                const newQs: PaperSectionQuestion[] = [...sec.questions];
                const pool = allAvailableQuestions.filter(q => !newQs.some(sq => sq.text === q.text));

                for (let i = 0; i < diff; i++) {
                    const pick = pool[i] || mockQuestions[i % mockQuestions.length];
                    newQs.push({
                        id: `auto-${secIdx}-${Date.now()}-${i}`,
                        text: pick.text,
                        marks: sec.marksPerQuestion,
                        difficulty: pick.difficulty,
                        topic: pick.unit,
                        blooms_level: 'Apply'
                    });
                }
                return { ...sec, questions: newQs };
            });
        });
    };

    // Save Paper
    const handleSavePaper = async () => {
        if (generatedPaperId) {
            try {
                await fetch(`${BACKEND_URL}/papers/${generatedPaperId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Approved' }),
                });
            } catch (err) {
                console.error('Update status error:', err);
            }
        }

        const newPaper = {
            id: generatedPaperId || `gp-${Date.now()}`,
            title: `${subjectName} - ${examName}`,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            totalMarks: currentTotalMarks,
            blueprintId: selectedBlueprint?.id || 'bp1'
        };

        // Append to mockGeneratedPapers for real session persistence
        mockGeneratedPapers.unshift(newPaper);
        setIsSaved(true);
        setStep(6);
    };

    const steps = [
        { num: 1, label: 'Source' },
        { num: 2, label: 'Blueprint' },
        { num: 3, label: 'Configure' },
        { num: 4, label: 'Generate' },
        { num: 5, label: 'Review & Edit' },
        { num: 6, label: 'Export' },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-16">
            {/* Wizard Stepper Header */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between overflow-x-auto py-1">
                    {steps.map((s, idx) => {
                        const isCompleted = step > s.num;
                        const isCurrent = step === s.num;

                        return (
                            <div key={s.num} className="flex items-center flex-1 min-w-[120px] px-2">
                                <button
                                    onClick={() => {
                                        // Allow navigating back to completed steps
                                        if (isCompleted) setStep(s.num as any);
                                    }}
                                    disabled={!isCompleted && !isCurrent}
                                    className={`flex items-center space-x-2 text-left transition-all ${
                                        isCurrent
                                            ? 'text-amber-400 font-bold'
                                            : isCompleted
                                            ? 'text-slate-300 hover:text-white cursor-pointer'
                                            : 'text-slate-600 cursor-not-allowed'
                                    }`}
                                >
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                            isCurrent
                                                ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30'
                                                : isCompleted
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'bg-slate-800 text-slate-500'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                                    </div>
                                    <span className="text-xs uppercase tracking-wider font-semibold whitespace-nowrap">
                                        {s.label}
                                    </span>
                                </button>
                                {idx < steps.length - 1 && (
                                    <div className={`h-[2px] flex-1 mx-3 rounded transition-colors ${
                                        step > s.num ? 'bg-emerald-500/40' : 'bg-slate-800'
                                    }`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 1: CHOOSE QUESTION SOURCE                                            */}
            {/* ========================================================================= */}
            {step === 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">Choose Question Source</h2>
                            <p className="text-slate-400">Select where ExamGen should find questions for this examination.</p>
                        </div>
                        <Button
                            onClick={() => setShowUploadInStep1(!showUploadInStep1)}
                            className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-medium"
                        >
                            <Upload className="w-4 h-4 mr-2 text-amber-400" />
                            {showUploadInStep1 ? 'Hide Uploader' : '+ Upload Question Bank'}
                        </Button>
                    </div>

                    {/* Embedded Direct Upload Box */}
                    <AnimatePresence>
                        {showUploadInStep1 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl backdrop-blur-xl shadow-2xl space-y-4"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-base font-bold text-white">Direct Document Ingestion</h3>
                                        <p className="text-xs text-slate-400">Upload PDF, DOCX, XLSX, or CSV. Questions will be parsed and selected automatically.</p>
                                    </div>
                                    <button onClick={() => setShowUploadInStep1(false)} className="text-slate-500 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div
                                    onClick={() => uploadInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl p-6 text-center cursor-pointer bg-slate-950/50 transition-colors"
                                >
                                    <input
                                        ref={uploadInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                                        onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleFileUpload(f);
                                        }}
                                    />
                                    {isUploading ? (
                                        <div className="flex flex-col items-center space-y-2">
                                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                                            <p className="text-sm font-semibold text-slate-200">Parsing questions with FastAPI service...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-2">
                                            <CloudUpload className="w-8 h-8 text-slate-400" />
                                            <p className="text-sm font-medium text-slate-200">Click to upload or drag & drop question paper file</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Smart Recommendation Card */}
                    {selectedBank && recommendedBp && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
                        >
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Recommended Setup</span>
                                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">Smart Match</Badge>
                                    </div>
                                    <p className="text-sm text-slate-200 mt-0.5">
                                        Found <span className="text-white font-semibold">{selectedBank.name}</span> with matching <span className="text-white font-semibold">{recommendedBp.name}</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 w-full md:w-auto">
                                <Button
                                    onClick={() => {
                                        setSelectedBlueprint(recommendedBp);
                                        setSubjectName(selectedBank.subject || 'Database Management Systems');
                                        setStep(3); // Jump straight to Configure!
                                    }}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs h-9 shadow-md shadow-amber-500/20"
                                >
                                    Use Recommended Setup <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                    className="border-slate-700 bg-slate-900/50 text-slate-300 hover:text-white text-xs h-9"
                                >
                                    Choose Manually
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Search & Filter */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="Filter existing question banks by name or subject..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                        />
                    </div>

                    {/* Question Banks Cards */}
                    {isLoadingBanks ? (
                        <div className="py-16 text-center">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm text-slate-400">Loading available question banks...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {banks
                                .filter(b => (b.name || '').toLowerCase().includes(bankSearch.toLowerCase()) || (b.subject || '').toLowerCase().includes(bankSearch.toLowerCase()))
                                .map((b) => {
                                    const isSel = selectedBank?.id === b.id;
                                    return (
                                        <Card
                                            key={b.id}
                                            onClick={() => {
                                                setSelectedBank(b);
                                                if (b.subject) setSubjectName(b.subject);
                                            }}
                                            className={`cursor-pointer border-2 transition-all p-4 rounded-xl backdrop-blur-sm ${
                                                isSel
                                                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center space-x-2.5">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 border border-slate-700">
                                                        <Database className="w-4 h-4" />
                                                    </div>
                                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[11px]">
                                                        {b.subject || 'General'}
                                                    </Badge>
                                                </div>
                                                {isSel && <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                                            </div>
                                            <h4 className="font-semibold text-white text-sm line-clamp-1 mb-1" title={b.name}>
                                                {b.name}
                                            </h4>
                                            <div className="flex justify-between items-center text-xs text-slate-500 mt-3 pt-2 border-t border-slate-800/50">
                                                <span>{b.questions_count ? `${b.questions_count} Questions` : 'Ready'}</span>
                                                <span className="text-[11px]">{b.file_type || 'DOC'}</span>
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <Button
                            disabled={!selectedBank}
                            onClick={() => setStep(2)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11"
                        >
                            Continue to Blueprint <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: DEFINE PAPER BLUEPRINT                                            */}
            {/* ========================================================================= */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">Define Paper Blueprint</h2>
                            <p className="text-slate-400">Choose the structural marking scheme and section rules for this examination.</p>
                        </div>
                        <div className="flex space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setBlueprintMode('existing')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    blueprintMode === 'existing' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                1. Use Existing
                            </button>
                            <button
                                onClick={() => setBlueprintMode('create')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    blueprintMode === 'create' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                2. Create New
                            </button>
                            <button
                                onClick={() => setBlueprintMode('ai')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    blueprintMode === 'ai' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                3. Let AI Create
                            </button>
                        </div>
                    </div>

                    {/* Mode 1: Use Existing Blueprint */}
                    {blueprintMode === 'existing' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {blueprints.map((bp) => {
                                const isSel = selectedBlueprint?.id === bp.id;
                                const total = bp.sections.reduce((acc, s) => acc + s.totalMarks, 0);

                                return (
                                    <Card
                                        key={bp.id}
                                        onClick={() => setSelectedBlueprint(bp)}
                                        className={`cursor-pointer border-2 transition-all p-5 rounded-xl backdrop-blur-sm ${
                                            isSel
                                                ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-white text-base">{bp.name}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">{bp.sections.length} Sections</p>
                                            </div>
                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-bold px-2.5 py-1">
                                                {total} Marks
                                            </Badge>
                                        </div>

                                        <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-lg border border-slate-800/80 text-xs text-slate-300">
                                            {bp.sections.map(s => (
                                                <div key={s.id} className="flex justify-between items-center">
                                                    <span>{s.name} ({s.numberOfQuestions} × {s.marksPerQuestion}m)</span>
                                                    <span className="font-bold text-amber-400">{s.totalMarks} M</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Mode 2: Create New Blueprint */}
                    {blueprintMode === 'create' && (
                        <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-5 rounded-2xl">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Blueprint Title</label>
                                <Input
                                    placeholder="e.g. End-Term Comprehensive Exam Blueprint"
                                    value={newBpTitle}
                                    onChange={(e) => setNewBpTitle(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white h-11"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-slate-300">Sections</label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setNewBpSections(prev => [...prev, {
                                            id: `s-${Date.now()}`,
                                            name: `Section ${String.fromCharCode(65 + prev.length)}`,
                                            marksPerQuestion: 5,
                                            numberOfQuestions: 4,
                                            totalMarks: 20
                                        }])}
                                        className="text-xs border-slate-700 bg-slate-800 text-white"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add Section
                                    </Button>
                                </div>

                                {newBpSections.map((sec, idx) => (
                                    <div key={sec.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 items-center">
                                        <div className="md:col-span-5">
                                            <Input
                                                value={sec.name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setNewBpSections(prev => prev.map(s => s.id === sec.id ? { ...s, name: val } : s));
                                                }}
                                                className="bg-slate-900 border-slate-700 text-white h-9 text-xs"
                                            />
                                        </div>
                                        <div className="md:col-span-3 flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                value={sec.marksPerQuestion}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setNewBpSections(prev => prev.map(s => s.id === sec.id ? { ...s, marksPerQuestion: val, totalMarks: val * s.numberOfQuestions } : s));
                                                }}
                                                className="bg-slate-900 border-slate-700 text-white h-9 text-xs"
                                                placeholder="Marks/Q"
                                            />
                                            <span className="text-xs text-slate-500">m ×</span>
                                            <Input
                                                type="number"
                                                value={sec.numberOfQuestions}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value);
                                                    setNewBpSections(prev => prev.map(s => s.id === sec.id ? { ...s, numberOfQuestions: val, totalMarks: s.marksPerQuestion * val } : s));
                                                }}
                                                className="bg-slate-900 border-slate-700 text-white h-9 text-xs"
                                                placeholder="Count"
                                            />
                                        </div>
                                        <div className="md:col-span-3 text-right">
                                            <span className="text-xs font-bold text-amber-400">{sec.marksPerQuestion * sec.numberOfQuestions} Marks</span>
                                        </div>
                                        <div className="md:col-span-1 text-right">
                                            <button
                                                onClick={() => setNewBpSections(prev => prev.filter(s => s.id !== sec.id))}
                                                className="text-slate-500 hover:text-red-400 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={() => {
                                    if (!newBpTitle.trim()) { alert('Please enter blueprint title'); return; }
                                    const created: Blueprint = {
                                        id: `bp-${Date.now()}`,
                                        name: newBpTitle.trim(),
                                        sections: newBpSections
                                    };
                                    setBlueprints(prev => [created, ...prev]);
                                    setSelectedBlueprint(created);
                                    setBlueprintMode('existing');
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                            >
                                Save & Select Blueprint
                            </Button>
                        </Card>
                    )}

                    {/* Mode 3: AI Blueprint Generator */}
                    {blueprintMode === 'ai' && (
                        <Card className="bg-slate-900/60 border-slate-800 p-6 space-y-5 rounded-2xl">
                            <div className="flex items-center space-x-3 text-amber-400">
                                <Sparkles className="w-5 h-5" />
                                <h3 className="text-base font-bold text-white">Let AI Create Balanced Blueprint</h3>
                            </div>
                            <p className="text-xs text-slate-400">
                                Specify your target marks. ExamGen AI will automatically design an accredited 3-part section distribution.
                            </p>
                            <div className="flex items-center space-x-4 max-w-xs">
                                <Input
                                    type="number"
                                    value={aiMarksInput}
                                    onChange={(e) => setAiMarksInput(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-white h-11"
                                    placeholder="Total Marks (e.g. 50, 70, 100)"
                                />
                                <Button
                                    onClick={handleGenerateAiBlueprint}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-11"
                                >
                                    ✦ Generate Scheme
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Selected Blueprint Summary */}
                    {selectedBlueprint && (
                        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <span className="text-xs text-slate-400 uppercase font-semibold">Active Selection:</span>
                                    <p className="text-sm font-bold text-white">{selectedBlueprint.name}</p>
                                </div>
                            </div>
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-sm font-bold">
                                {targetBlueprintMarks} Total Marks
                            </Badge>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(1)} className="border-slate-800 text-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Source
                        </Button>
                        <Button
                            disabled={!selectedBlueprint}
                            onClick={() => setStep(3)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11"
                        >
                            Continue to Configure <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: CONFIGURE PAPER                                                   */}
            {/* ========================================================================= */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-1">Configure Examination</h2>
                        <p className="text-slate-400">Set paper metadata, topics coverage, and Bloom&apos;s Taxonomy target distributions.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Form Fields */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="bg-slate-900/50 border-slate-800 p-6 space-y-4 rounded-2xl backdrop-blur-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase">Subject</label>
                                        <Input
                                            value={subjectName}
                                            onChange={(e) => setSubjectName(e.target.value)}
                                            className="bg-slate-950 border-slate-800 text-white h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase">Examination Name</label>
                                        <Input
                                            value={examName}
                                            onChange={(e) => setExamName(e.target.value)}
                                            className="bg-slate-950 border-slate-800 text-white h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase">Total Marks</label>
                                        <Input
                                            disabled
                                            value={targetBlueprintMarks}
                                            className="bg-slate-950 border-slate-800 text-amber-400 font-bold h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase">Duration (Minutes)</label>
                                        <Input
                                            type="number"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="bg-slate-950 border-slate-800 text-white h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-300 uppercase">Difficulty Profile</label>
                                        <select
                                            value={difficulty}
                                            onChange={(e) => setDifficulty(e.target.value as any)}
                                            className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 text-white px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                                        >
                                            <option value="Balanced">Balanced (30E / 50M / 20H)</option>
                                            <option value="Easy">Standard / Foundation (50E / 40M / 10H)</option>
                                            <option value="Moderate">Moderate Academic</option>
                                            <option value="Challenging">Challenging / Competitive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Syllabus Topics / Units */}
                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase">Include Units / Modules</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'].map((u) => {
                                            const checked = selectedUnits.includes(u);
                                            return (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => setSelectedUnits(prev =>
                                                        checked ? prev.filter(x => x !== u) : [...prev, u]
                                                    )}
                                                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                                                        checked
                                                            ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                                    }`}
                                                >
                                                    <span>{u}</span>
                                                    {checked && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bloom's Taxonomy */}
                                <div className="space-y-2 pt-2">
                                    <label className="text-xs font-semibold text-slate-300 uppercase">Bloom&apos;s Taxonomy Distribution</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['Remember', 'Understand', 'Apply', 'Analyze'].map((b) => {
                                            const checked = selectedBlooms.includes(b);
                                            return (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => setSelectedBlooms(prev =>
                                                        checked ? prev.filter(x => x !== b) : [...prev, b]
                                                    )}
                                                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-between ${
                                                        checked
                                                            ? 'bg-purple-500/10 border-purple-500 text-purple-300'
                                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                                    }`}
                                                >
                                                    <span>{b}</span>
                                                    {checked && <Check className="w-3.5 h-3.5 text-purple-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Validation & Blueprint Summary */}
                        <div className="lg:col-span-4 space-y-4">
                            <Card className="bg-slate-900/50 border-slate-800 p-5 rounded-2xl">
                                <CardHeader className="p-0 pb-3">
                                    <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">
                                        Validation Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-3">
                                    <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>Blueprint Total ({targetBlueprintMarks}M) verified</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{selectedUnits.length} Units selected for coverage</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                                        Questions will be automatically balanced according to these parameters.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(2)} className="border-slate-800 text-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blueprint
                        </Button>
                        <Button
                            onClick={() => setStep(4)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11"
                        >
                            Proceed to Generate <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: GENERATE PAPER                                                    */}
            {/* ========================================================================= */}
            {step === 4 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl mx-auto text-center">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Ready to Generate Examination Paper</h2>
                        <p className="text-slate-400">Review your final parameters. Click generate to assemble the paper.</p>
                    </div>

                    {/* Summary Parameters Card */}
                    <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-left space-y-4 shadow-xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                            <div>
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Question Source</span>
                                <p className="text-sm font-bold text-white mt-0.5">{selectedBank?.name || 'Uploaded Question Bank'}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Blueprint</span>
                                <p className="text-sm font-bold text-white mt-0.5">{selectedBlueprint?.name} ({targetBlueprintMarks} Marks)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Subject & Exam</span>
                                <p className="text-sm text-slate-200 mt-0.5">{subjectName} • {examName}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Difficulty</span>
                                <p className="text-sm text-amber-400 font-medium mt-0.5">{difficulty}</p>
                            </div>
                            <div>
                                <span className="text-[11px] text-slate-500 uppercase font-semibold">Syllabus Covered</span>
                                <p className="text-sm text-slate-200 mt-0.5">{selectedUnits.join(', ')}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Prominent Generation CTA */}
                    <div className="space-y-4 pt-2">
                        {isGenerating ? (
                            <div className="p-8 bg-slate-900/80 border border-amber-500/30 rounded-2xl space-y-4 max-w-md mx-auto">
                                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                                <div>
                                    <h4 className="text-base font-bold text-white mb-1">Generating Examination Paper</h4>
                                    <p className="text-xs text-slate-400">{generationStatusText}</p>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-full transition-all duration-300"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={executeGeneration}
                                className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-extrabold text-lg px-10 py-6 rounded-2xl shadow-xl shadow-amber-500/25 transition-transform hover:scale-105 active:scale-95"
                            >
                                <Sparkles className="w-6 h-6 mr-3" /> ✦ Generate Paper
                            </Button>
                        )}
                    </div>

                    <div className="flex justify-center pt-6">
                        <Button variant="ghost" onClick={() => setStep(3)} className="text-slate-500 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Configuration
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 5: REVIEW & EDIT (THE CORNERSTONE UX)                                */}
            {/* ========================================================================= */}
            {step === 5 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Header with Quick Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">Review & Edit Paper</h2>
                            <p className="text-slate-400">Contextually edit, replace, or reorder questions. Validated against blueprint rules.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                onClick={handleSavePaper}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20"
                            >
                                <Save className="w-4 h-4 mr-2" /> Save & Continue to Export
                            </Button>
                        </div>
                    </div>

                    {/* Blueprint Compliance & Quality Validation Bar */}
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                                currentTotalMarks === targetBlueprintMarks
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                                {currentTotalMarks === targetBlueprintMarks ? <Check className="w-5 h-5" /> : '!'}
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 uppercase font-semibold">Total Marks Validation</span>
                                <p className="text-sm font-bold text-white">
                                    {currentTotalMarks} / {targetBlueprintMarks} Marks
                                    {currentTotalMarks === targetBlueprintMarks ? (
                                        <span className="text-emerald-400 text-xs ml-2 font-normal">✓ Perfect match</span>
                                    ) : (
                                        <span className="text-amber-400 text-xs ml-2 font-normal">⚠️ Mismatch detected</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {currentTotalMarks !== targetBlueprintMarks && (
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    onClick={handleAutoFixValidation}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs h-8"
                                >
                                    Fix Automatically
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Paper Layout Canvas (A4 Realistic Layout) */}
                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl backdrop-blur-sm">
                        {/* College Header */}
                        <div className="text-center border-b-2 border-slate-800 pb-6 space-y-1">
                            <h3 className="text-xl font-bold uppercase tracking-widest text-white">
                                Department of Computer Engineering
                            </h3>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">
                                Autonomous Institute Affiliated to State University
                            </p>
                            <h4 className="text-lg font-bold text-amber-400 pt-1">
                                {examName} • Academic Year 2025-2026
                            </h4>
                            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pt-3 max-w-2xl mx-auto">
                                <span>Subject: {subjectName}</span>
                                <span>Time: {duration} Minutes</span>
                                <span>Max Marks: {targetBlueprintMarks}</span>
                            </div>
                        </div>

                        {/* Standard Instructions */}
                        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
                            <p className="font-semibold text-slate-300 uppercase tracking-wider">Instructions to Candidates:</p>
                            <ol className="list-decimal list-inside space-y-0.5">
                                <li>All questions are compulsory unless internal choice is specified.</li>
                                <li>Figures to the right indicate full marks assigned to each question.</li>
                                <li>Assume suitable additional data if necessary and state it clearly.</li>
                                <li>Use of non-programmable scientific calculator is permitted.</li>
                            </ol>
                        </div>

                        {/* Sections & Questions */}
                        {paperSections.map((sec, secIdx) => (
                            <div key={sec.id} className="space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <h4 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
                                        <span className="text-amber-500 mr-2">■</span> {sec.name}
                                    </h4>
                                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                                        {sec.questions.length} / {sec.targetCount} Questions • {sec.marksPerQuestion}M Each
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {sec.questions.map((q, qIdx) => (
                                        <div
                                            key={q.id || `${secIdx}-${qIdx}`}
                                            className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl transition-all group relative"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <span className="font-bold text-amber-500 text-sm mt-0.5">Q{qIdx + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-slate-100 font-medium leading-relaxed">
                                                            {q.text}
                                                        </p>
                                                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
                                                            <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                                                {q.topic || 'Unit 1'}
                                                            </span>
                                                            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                                {q.difficulty || 'Medium'}
                                                            </span>
                                                            {q.blooms_level && (
                                                                <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                                                                    Bloom: {q.blooms_level}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end space-y-2">
                                                    <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                                                        [{q.marks}M]
                                                    </span>

                                                    {/* Contextual Actions */}
                                                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenReplaceModal(secIdx, qIdx)}
                                                            className="h-7 text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-amber-400 px-2"
                                                            title="Replace with another question from bank"
                                                        >
                                                            <RefreshCw className="w-3 h-3 mr-1" /> Replace
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingQuestion({ sectionIndex: secIdx, questionIndex: qIdx, text: q.text, marks: q.marks })}
                                                            className="h-7 text-xs border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 px-2"
                                                            title="Edit question text"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                        </Button>
                                                        <button
                                                            onClick={() => handleRemoveQuestion(secIdx, qIdx)}
                                                            className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                                            title="Remove Question"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Replacement Modal */}
                    <AnimatePresence>
                        {replaceModal.isOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
                                >
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Choose Replacement Question</h3>
                                            <p className="text-xs text-slate-400">Select an alternate question to swap into this slot.</p>
                                        </div>
                                        <button
                                            onClick={() => setReplaceModal({ isOpen: false, sectionIndex: -1, questionIndex: -1, currentQuestion: null })}
                                            className="text-slate-500 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Search in Modal */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        <div className="md:col-span-8 relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                                            <Input
                                                placeholder="Search replacement questions..."
                                                value={replaceSearch}
                                                onChange={(e) => setReplaceSearch(e.target.value)}
                                                className="pl-10 bg-slate-950 border-slate-800 text-white h-9 text-xs"
                                            />
                                        </div>
                                        <div className="md:col-span-4">
                                            <select
                                                value={replaceDiffFilter}
                                                onChange={(e) => setReplaceDiffFilter(e.target.value)}
                                                className="w-full h-9 rounded-xl bg-slate-950 border border-slate-800 text-white px-2 text-xs"
                                            >
                                                <option value="all">All Difficulties</option>
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Questions List */}
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {allAvailableQuestions
                                            .filter(q => {
                                                const matchesSearch = (q.text || '').toLowerCase().includes(replaceSearch.toLowerCase()) ||
                                                    (q.topic || '').toLowerCase().includes(replaceSearch.toLowerCase());
                                                const matchesDiff = replaceDiffFilter === 'all' || q.difficulty === replaceDiffFilter;
                                                return matchesSearch && matchesDiff;
                                            })
                                            .map((cand) => (
                                                <div
                                                    key={cand.id}
                                                    onClick={() => handleConfirmReplacement(cand)}
                                                    className="p-3 bg-slate-950/60 border border-slate-800 hover:border-amber-500 rounded-xl cursor-pointer transition-all flex justify-between items-start gap-3 group"
                                                >
                                                    <div className="flex-1 text-xs text-slate-200 group-hover:text-white">
                                                        <p className="line-clamp-2">{cand.text}</p>
                                                        <div className="flex space-x-2 mt-1.5 text-[10px] text-slate-500">
                                                            <span>{cand.unit || 'Unit 1'}</span>
                                                            <span>•</span>
                                                            <span className="text-amber-400">{cand.difficulty}</span>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-slate-900 text-slate-300 border-slate-800 text-xs">
                                                        {cand.marks}M
                                                    </Badge>
                                                </div>
                                            ))}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Inline Edit Modal */}
                    <AnimatePresence>
                        {editingQuestion && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
                                >
                                    <h3 className="text-lg font-bold text-white">Edit Question Content</h3>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-semibold">Question Text</label>
                                        <textarea
                                            rows={4}
                                            value={editingQuestion.text}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400 font-semibold">Assigned Marks</label>
                                        <Input
                                            type="number"
                                            value={editingQuestion.marks}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                                            className="bg-slate-950 border-slate-800 text-white h-10"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <Button variant="ghost" onClick={() => setEditingQuestion(null)} className="text-slate-400">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setPaperSections(prev => {
                                                    const next = [...prev];
                                                    const sec = { ...next[editingQuestion.sectionIndex] };
                                                    const qList = [...sec.questions];
                                                    qList[editingQuestion.questionIndex] = {
                                                        ...qList[editingQuestion.questionIndex],
                                                        text: editingQuestion.text,
                                                        marks: editingQuestion.marks
                                                    };
                                                    sec.questions = qList;
                                                    next[editingQuestion.sectionIndex] = sec;
                                                    return next;
                                                });
                                                setEditingQuestion(null);
                                            }}
                                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(4)} className="border-slate-800 text-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Parameters
                        </Button>
                        <Button
                            onClick={handleSavePaper}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11"
                        >
                            Save & Export Paper <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* ========================================================================= */}
            {/* STEP 6: SAVE & EXPORT                                                     */}
            {/* ========================================================================= */}
            {step === 6 && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 max-w-2xl mx-auto text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white">Paper Saved Successfully!</h2>
                        <p className="text-slate-400 text-sm">
                            <span className="text-white font-semibold">{subjectName} - {examName}</span> has been saved into your generated papers archive.
                        </p>
                    </div>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                        <Button
                            onClick={() => window.print()}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold h-12 flex items-center justify-center"
                        >
                            <Printer className="w-4 h-4 mr-2 text-amber-400" /> Print / PDF
                        </Button>
                        <Button
                            onClick={() => window.print()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 shadow-lg shadow-emerald-500/20 flex items-center justify-center"
                        >
                            <Download className="w-4 h-4 mr-2" /> Export PDF
                        </Button>
                        <Link href="/dashboard/generated">
                            <Button
                                variant="outline"
                                className="w-full bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white font-semibold h-12"
                            >
                                <Eye className="w-4 h-4 mr-2" /> View Archive
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-6 border-t border-slate-800/80">
                        <Button
                            onClick={() => {
                                setStep(1);
                                setIsSaved(false);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 h-11"
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Generate Another Paper
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

export default function GeneratePaperPage() {
    return (
        <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading Exam Generator...</div>}>
            <GeneratePaperContent />
        </Suspense>
    );
}
