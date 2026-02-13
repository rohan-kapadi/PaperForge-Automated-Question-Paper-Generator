'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, MoreVertical, Calendar, Clock } from 'lucide-react';

export default function GeneratedPapersPage() {
    const papers = [
        {
            id: 1,
            title: 'Database Management Systems - Mid Term',
            date: 'Oct 12, 2025',
            type: 'Mid-Term',
            marks: 50,
            questions: 24,
            status: 'Ready'
        },
        {
            id: 2,
            title: 'Operating Systems - End Term',
            date: 'Sep 28, 2025',
            type: 'End-Term',
            marks: 100,
            questions: 32,
            status: 'Ready'
        },
        {
            id: 3,
            title: 'Computer Networks - Quiz 1',
            date: 'Sep 15, 2025',
            type: 'Quiz',
            marks: 20,
            questions: 10,
            status: 'Draft'
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Generated Papers</h2>
                    <p className="text-slate-400">Access and download your previously created exam papers.</p>
                </div>
            </div>

            <div className="space-y-4">
                {papers.map((paper) => (
                    <div
                        key={paper.id}
                        className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm hover:shadow-lg"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 group-hover:bg-slate-700 transition-colors">
                                <FileText className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">{paper.title}</h3>
                                <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {paper.date}</span>
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {paper.type}</span>
                                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">{paper.marks} Marks</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 w-full md:w-auto mt-2 md:mt-0">
                            <Button variant="outline" size="sm" className="bg-slate-950 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                                <Eye className="w-4 h-4 mr-2" /> Preview
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-lg shadow-emerald-500/20">
                                <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
