'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator, Save, AlertCircle } from 'lucide-react';

export default function BlueprintBuilderPage() {
    const [sections, setSections] = useState([
        { id: 1, name: 'Part A (MCQ)', marksPerQuestion: 1, count: 10, total: 10 },
        { id: 2, name: 'Part B (Short Answer)', marksPerQuestion: 5, count: 5, total: 25 },
        { id: 3, name: 'Part C (Long Answer)', marksPerQuestion: 10, count: 3, total: 30 },
    ]);

    const updateSection = (id: number, field: string, value: string | number) => {
        setSections(sections.map(s => {
            if (s.id === id) {
                const updated = { ...s, [field]: value };
                // Recalculate total if numerical fields change
                if (field === 'marksPerQuestion' || field === 'count') {
                    updated.total = Number(updated.marksPerQuestion) * Number(updated.count);
                }
                return updated;
            }
            return s;
        }));
    };

    const addSection = () => {
        const newId = Math.max(...sections.map(s => s.id)) + 1;
        setSections([...sections, { id: newId, name: 'New Section', marksPerQuestion: 0, count: 0, total: 0 }]);
    };

    const removeSection = (id: number) => {
        setSections(sections.filter(s => s.id !== id));
    };

    const grandTotal = sections.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Blueprint Builder</h2>
                    <p className="text-slate-400">Define the structure and marking scheme of your exam.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-3 flex items-center space-x-4 shadow-lg">
                    <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">Total Marks</span>
                    <span className="text-2xl font-bold text-amber-500">{grandTotal}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    {sections.map((section, index) => (
                        <Card key={section.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all group backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 group-hover:bg-amber-500 transition-colors" />
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4 w-full mr-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-400 border border-slate-700 text-sm flex-shrink-0">
                                            {index + 1}
                                        </div>
                                        <Input
                                            value={section.name}
                                            onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                                            className="font-semibold text-lg bg-transparent border-transparent hover:border-slate-700 focus:border-amber-500 focus:ring-0 text-white w-full px-2 h-10 transition-colors"
                                            placeholder="Section Name"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSection(section.id)}
                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-12">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marks / Q</label>
                                        <Input
                                            type="number"
                                            value={section.marksPerQuestion}
                                            onChange={(e) => updateSection(section.id, 'marksPerQuestion', Number(e.target.value))}
                                            className="bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No. of Qs</label>
                                        <Input
                                            type="number"
                                            value={section.count}
                                            onChange={(e) => updateSection(section.id, 'count', Number(e.target.value))}
                                            className="bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500 h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subtotal</label>
                                        <div className="flex items-center h-10 px-4 bg-slate-950/50 rounded-lg border border-slate-800 text-amber-500 font-mono font-bold justify-end">
                                            {section.total}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button
                        onClick={addSection}
                        className="w-full h-14 border-2 border-dashed border-slate-700 bg-slate-900/30 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-500 text-slate-400 transition-all rounded-xl border-dashed"
                        variant="outline"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add New Section
                    </Button>
                </div>

                {/* Summary Panel */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-900 border-slate-800 shadow-2xl sticky top-24">
                        <CardHeader className="bg-slate-950/50 border-b border-slate-800 pb-4">
                            <CardTitle className="flex items-center text-white text-lg">
                                <Calculator className="w-5 h-5 mr-3 text-amber-500" />
                                Configuration Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Total Sections</span>
                                    <span className="text-white font-medium">{sections.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Total Questions</span>
                                    <span className="text-white font-medium">{sections.reduce((acc, curr) => acc + curr.count, 0)}</span>
                                </div>
                                <div className="h-px bg-slate-800 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-medium text-white">Grand Total</span>
                                    <span className="text-2xl font-bold text-amber-500">{grandTotal} Marks</span>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/80 leading-relaxed">
                                    Ensure your total marks match university guidelines (usually 100 or 70 marks).
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 border-t border-slate-800 bg-slate-950/30">
                            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-500/20 h-11 transition-all hover:scale-[1.02]" size="lg">
                                <Save className="w-4 h-4 mr-2" />
                                Save Configuration
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
