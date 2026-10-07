'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, Clock, Trash2, CloudUpload, AlertCircle, FileText, FileUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

const BACKEND_URL = 'http://localhost:3001';

type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

interface UploadedFile {
    id: string;
    name: string;
    size: string;
    status: UploadStatus;
    questions: number;
    error?: string;
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ name }: { name: string }) {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-blue-400" />;
    return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
}

export default function UploadPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/questions/banks`);
                if (res.ok) {
                    const data = await res.json();
                    const existingFiles: UploadedFile[] = data.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        size: 'Uploaded',
                        status: 'done',
                        questions: b.questions_count,
                    }));
                    setFiles(existingFiles);
                }
            } catch (err) {
                console.error("Failed to fetch existing banks", err);
            }
        };
        fetchBanks();
    }, []);

    const processFile = useCallback(async (rawFile: File) => {
        const id = `${Date.now()}-${rawFile.name}`;
        const entry: UploadedFile = {
            id,
            name: rawFile.name,
            size: formatBytes(rawFile.size),
            status: 'uploading',
            questions: 0,
        };

        setFiles((prev) => [entry, ...prev]);

        try {
            const form = new FormData();
            form.append('file', rawFile);

            const res = await fetch(`${BACKEND_URL}/questions/upload`, {
                method: 'POST',
                body: form,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(err.message ?? 'Upload failed');
            }

            const data = await res.json();

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? { ...f, id: data.bankId ?? f.id, status: 'done', questions: data.total ?? 0 }
                        : f
                )
            );
        } catch (err: any) {
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === id
                        ? { ...f, status: 'error', error: err.message }
                        : f
                )
            );
        }
    }, []);

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;
            Array.from(fileList).forEach((f) => processFile(f));
        },
        [processFile]
    );

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Upload Question Bank</h2>
                    <p className="text-slate-400">Import questions from PDF, DOCX, Excel, or CSV files.</p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/dashboard/banks">
                        <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white">
                            View Question Banks
                        </Button>
                    </Link>
                    <Link href="/dashboard/generate">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold">
                            <Sparkles className="w-4 h-4 mr-1.5" /> Generate Paper
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all group
                    ${isDragging
                        ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                        : 'border-slate-700 bg-slate-900/30 hover:border-amber-500/50 hover:bg-slate-900/50'
                    }`}
            >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/20 transition-all
                    ${isDragging ? 'bg-amber-500/20 scale-110' : 'bg-slate-800 group-hover:scale-110'}`}>
                    <CloudUpload className={`w-10 h-10 ${isDragging ? 'text-amber-400' : 'text-amber-500'}`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                    {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Supported formats: <span className="text-amber-400 font-medium">.pdf, .docx, .xlsx, .xls, .csv</span> (Max 10MB)
                </p>
                <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-8 h-12 rounded-xl shadow-lg shadow-amber-500/20 pointer-events-none">
                    <FileUp className="w-4 h-4 mr-2" />
                    Select Files
                </Button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Uploaded Files List */}
                <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Recent Uploads</CardTitle>
                        <CardDescription className="text-slate-400">
                            {files.length === 0 ? 'No files uploaded yet.' : `${files.length} file(s)`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {files.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>Upload a file to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
                                    >
                                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0
                                                ${file.status === 'error'
                                                    ? 'bg-red-500/10 border-red-500/20'
                                                    : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                                <FileIcon name={file.name} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">{file.name}</h4>
                                                <div className="flex items-center space-x-3 mt-1 flex-wrap gap-y-1">
                                                    <span className="text-xs text-slate-500">{file.size}</span>
                                                    {file.status === 'done' && (
                                                        <span className="text-xs text-emerald-400 flex items-center">
                                                            <div className="w-1 h-1 bg-slate-600 rounded-full mx-2" />
                                                            {file.questions} questions extracted
                                                        </span>
                                                    )}
                                                    {file.status === 'error' && (
                                                        <span className="text-xs text-red-400 truncate max-w-xs">{file.error}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-3 flex-shrink-0">
                                            {file.status === 'done' ? (
                                                <Badge className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Done
                                                </Badge>
                                            ) : file.status === 'uploading' ? (
                                                <Badge className="text-amber-400 border-amber-500/20 bg-amber-500/10 animate-pulse">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Processing
                                                </Badge>
                                            ) : (
                                                <Badge className="text-red-400 border-red-500/20 bg-red-500/10">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Failed
                                                </Badge>
                                            )}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    setFiles((prev) => prev.filter((f) => f.id !== file.id));
                                                    // Best-effort delete on the backend
                                                    try {
                                                        await fetch(`${BACKEND_URL}/questions/banks/${file.id}`, {
                                                            method: 'DELETE',
                                                        });
                                                    } catch (err) {
                                                        console.error('Failed to delete from backend', err);
                                                    }
                                                }}
                                                className="text-slate-600 hover:text-red-400 transition-colors p-2 bg-slate-900 border border-slate-800 rounded-md shadow-sm hover:border-red-500/30 hover:bg-red-500/10"
                                                title="Delete bank and all questions"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                <span><strong className="text-slate-300">Excel / CSV:</strong> Include columns: <code className="text-amber-400 text-xs">Question, Marks, Difficulty, Topic</code></span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span><strong className="text-slate-300">PDF / DOCX:</strong> Number your questions (e.g. <code className="text-amber-400 text-xs">Q1. / 1.</code>)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Maximum file size is 10MB per upload.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                <span>Difficulty values must be <code className="text-amber-400 text-xs">Easy</code>, <code className="text-amber-400 text-xs">Medium</code>, or <code className="text-amber-400 text-xs">Hard</code>.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
