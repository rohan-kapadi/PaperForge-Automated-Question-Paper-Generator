'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, Clock, X, CloudUpload } from 'lucide-react';

export default function UploadPage() {
    const [files, setFiles] = useState([
        { id: 1, name: 'DBMS_Questions.xlsx', size: '245 KB', status: 'completed', questions: 156 },
        { id: 2, name: 'OS_QuestionBank.csv', size: '189 KB', status: 'completed', questions: 124 },
        { id: 3, name: 'Networks_QB.xlsx', size: '312 KB', status: 'processing', questions: 0 },
    ]);

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">Upload Question Bank</h2>
                <p className="text-slate-400">Import your questions from Excel or CSV files.</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-slate-700 bg-slate-900/30 rounded-3xl p-10 text-center hover:border-amber-500/50 hover:bg-slate-900/50 transition-all group cursor-pointer">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-xl shadow-black/20">
                    <CloudUpload className="w-10 h-10 text-amber-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                    Click to upload or drag and drop
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Supported formats: .xlsx, .xls, .csv (Max 10MB)
                </p>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 h-12 rounded-xl shadow-lg shadow-amber-500/20">
                    Select Files
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Uploaded Files List */}
                <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Uploads</CardTitle>
                        <CardDescription className="text-slate-400">Manage your uploaded files</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors">{file.name}</h4>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-xs text-slate-500">{file.size}</span>
                                                {file.status === 'completed' && (
                                                    <span className="text-xs text-slate-500 flex items-center">
                                                        <div className="w-1 h-1 bg-slate-600 rounded-full mx-2" />
                                                        {file.questions} questions
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {file.status === 'completed' ? (
                                            <Badge className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Done
                                            </Badge>
                                        ) : (
                                            <Badge className="text-amber-400 border-amber-500/20 bg-amber-500/10 animate-pulse">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Processing
                                            </Badge>
                                        )}

                                        <button className="text-slate-600 hover:text-red-400 transition-colors p-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Guidelines */}
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-fit">
                    <CardHeader>
                        <CardTitle className="text-white">Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Ensure your Excel sheet has clear headers (Question, Marks, Unit, Topic).</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Images must be embedded or provided as accessible URLs.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Maximum file size is 10MB per upload batch.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Verify question difficulty levels (Easy, Medium, Hard) match formatting.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
