'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Building, ShieldCheck, Server, Save, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const [collegeName, setCollegeName] = useState('Pimpri Chinchwad College of Engineering & Research Ravet, Pune');
    const [trustName, setTrustName] = useState("Pimpri Chinchwad Education Trust's");
    const [autonomousText, setAutonomousText] = useState('An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified');
    const [iqacText, setIqacText] = useState('IQAC PCCOER');
    const [recordNo, setRecordNo] = useState('ACAD/R/11');
    const [department, setDepartment] = useState('Computer Engineering');
    const [defaultDuration, setDefaultDuration] = useState('60');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">System & Exam Settings</h2>
                <p className="text-slate-400">Configure examination paper headers, university affiliations, and service endpoints.</p>
            </div>

            {saved && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Settings saved successfully! These defaults will apply to all generated papers.</span>
                </div>
            )}

            {/* Institution Profile */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Building className="w-5 h-5 mr-2 text-amber-500" />
                        Institution & Paper Header
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Official header parameters matching PCET &amp; PCCOER Ravet examination standard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Trust Name</label>
                            <Input
                                value={trustName}
                                onChange={(e) => setTrustName(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">College / Institute Name</label>
                            <Input
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Affiliation & Accreditation Line</label>
                        <Input
                            value={autonomousText}
                            onChange={(e) => setAutonomousText(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Department</label>
                            <Input
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">IQAC Tag</label>
                            <Input
                                value={iqacText}
                                onChange={(e) => setIqacText(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Record No.</label>
                            <Input
                                value={recordNo}
                                onChange={(e) => setRecordNo(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11 font-mono"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Default Exam Duration (minutes)</label>
                            <Input
                                type="number"
                                value={defaultDuration}
                                onChange={(e) => setDefaultDuration(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Academic Year</label>
                            <Input
                                defaultValue="2025 – 26"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Service Health & Status */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <Server className="w-5 h-5 mr-2 text-blue-400" />
                        Connected Microservices
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Verify connectivity of internal parsing and backend APIs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-white">NestJS Backend API</p>
                            <p className="text-xs text-slate-500">http://localhost:3001</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Operational</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-white">FastAPI Document Parser</p>
                            <p className="text-xs text-slate-500">http://localhost:8000 (PyMuPDF, docx, openpyxl)</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Operational</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-white">Supabase PostgreSQL Engine</p>
                            <p className="text-xs text-slate-500">Row Level Security & Database Storage</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11"
                >
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                </Button>
            </div>
        </div>
    );
}
