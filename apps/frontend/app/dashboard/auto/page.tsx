'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Printer, Download, Eye } from 'lucide-react';
import { mockQuestions } from '@/lib/mockData';

export default function AutoGeneratePage() {
    const [selectedBlueprint, setSelectedBlueprint] = useState('1');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">

            {/* Left Column: Configuration */}
            <div className="lg:col-span-4 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Auto Generator</h2>
                    <p className="text-slate-400 text-sm">Select a blueprint to automatically generate a balanced paper.</p>
                </div>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Select Blueprint</label>
                            <select
                                className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 text-white px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                value={selectedBlueprint}
                                onChange={(e) => setSelectedBlueprint(e.target.value)}
                            >
                                <option value="1">Mid-Term Examination (50 Marks)</option>
                                <option value="2">End-Term Examination (100 Marks)</option>
                            </select>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Difficulty Distribution</span>
                                <span className="text-emerald-400">Balanced</span>
                            </div>
                            <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
                                <div className="w-[30%] bg-emerald-500" title="Easy (30%)" />
                                <div className="w-[50%] bg-amber-500" title="Medium (50%)" />
                                <div className="w-[20%] bg-red-500" title="Hard (20%)" />
                            </div>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />Easy (30%)</span>
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />Med (50%)</span>
                                <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-500 mr-2" />Hard (20%)</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold h-12 shadow-lg shadow-amber-500/20 mt-4"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2 animate-spin" /> Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" /> Generate Paper
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: A4 Preview */}
            <div className="lg:col-span-8 bg-slate-900/30 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px] pointer-events-none" />

                {/* Toolbar */}
                <div className="absolute top-4 right-4 flex space-x-2 z-10">
                    <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
                        <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                        <Download className="w-4 h-4 mr-2" /> Export PDF
                    </Button>
                </div>

                {/* A4 Paper */}
                <div className="w-[210mm] h-[297mm] bg-white text-black shadow-2xl transform scale-[0.6] origin-top p-12 overflow-hidden relative group transition-transform hover:scale-[0.62] duration-500">
                    {/* Paper Header */}
                    <div className="text-center border-b-2 border-black pb-4 mb-8">
                        <h1 className="text-2xl font-bold font-serif uppercase tracking-widest mb-2">University of Technology</h1>
                        <div className="flex justify-between text-sm font-semibold mt-4">
                            <span>Course: Computer Science</span>
                            <span>Semester: V</span>
                            <span>Time: 3 Hours</span>
                        </div>
                    </div>

                    {/* Questions Mockup */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-lg mb-4 uppercase border-b border-gray-300 pb-1">Part A - Multiple Choice Questions (10 Marks)</h3>
                            <div className="space-y-3 pl-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="text-sm">
                                        <span className="font-bold mr-2">{i}.</span>
                                        Question text placeholder for layout visualization...
                                        <div className="flex space-x-8 mt-1 ml-6 text-gray-600">
                                            <span>a) Option 1</span><span>b) Option 2</span><span>c) Option 3</span><span>d) Option 4</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-4 uppercase border-b border-gray-300 pb-1">Part B - Short Answer Questions (25 Marks)</h3>
                            <div className="space-y-4 pl-4">
                                {[4, 5].map((i) => (
                                    <div key={i} className="text-sm">
                                        <div className="flex justify-between">
                                            <span><span className="font-bold mr-2">{i}.</span>Explain the concept of normalization in database design.</span>
                                            <span className="font-bold">[5]</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Watermark Overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-lg font-bold text-slate-800">Generating Paper...</p>
                            <p className="text-sm text-slate-500">Balancing difficulty and topics</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
