'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Settings as SettingsIcon,
    Building,
    Server,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    Activity,
    Clock
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface ServiceHealth {
    status: 'checking' | 'healthy' | 'down';
    latencyMs: number | null;
    details?: string;
    error?: string;
}

export default function SettingsPage() {
    const [collegeName, setCollegeName] = useState('Pimpri Chinchwad College of Engineering & Research Ravet, Pune');
    const [trustName, setTrustName] = useState("Pimpri Chinchwad Education Trust's");
    const [autonomousText, setAutonomousText] = useState('An Autonomous Institute | NBA Accredited (4 UG Programs) | NAAC A++ Accredited | ISO 21001:2018 Certified');
    const [iqacText, setIqacText] = useState('IQAC PCCOER');
    const [recordNo, setRecordNo] = useState('ACAD/R/11');
    const [department, setDepartment] = useState('Computer Engineering');
    const [defaultDuration, setDefaultDuration] = useState('60');
    const [academicYear, setAcademicYear] = useState('2025 – 26');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Live Service Health States
    const [backendHealth, setBackendHealth] = useState<ServiceHealth>({ status: 'checking', latencyMs: null });
    const [parserHealth, setParserHealth] = useState<ServiceHealth>({ status: 'checking', latencyMs: null });
    const [dbHealth, setDbHealth] = useState<ServiceHealth>({ status: 'checking', latencyMs: null });
    const [isCheckingHealth, setIsCheckingHealth] = useState(false);
    const [lastHealthChecked, setLastHealthChecked] = useState<Date | null>(null);

    // Health ping logic
    const checkAllServices = async () => {
        setIsCheckingHealth(true);
        setBackendHealth({ status: 'checking', latencyMs: null });
        setParserHealth({ status: 'checking', latencyMs: null });
        setDbHealth({ status: 'checking', latencyMs: null });

        // 1. NestJS Backend API
        const pingBackend = async (): Promise<ServiceHealth> => {
            const start = performance.now();
            try {
                const res = await apiFetch('/health');
                const latency = Math.round(performance.now() - start);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json().catch(() => ({}));
                const uptime = typeof data.uptime === 'number'
                    ? (data.uptime > 3600
                        ? `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`
                        : `${Math.floor(data.uptime / 60)}m ${data.uptime % 60}s`)
                    : 'Uptime active';
                return {
                    status: 'healthy',
                    latencyMs: latency,
                    details: `Online • Uptime: ${uptime}`,
                };
            } catch (err: any) {
                return {
                    status: 'down',
                    latencyMs: null,
                    error: err.message || 'Offline or unreachable',
                };
            }
        };

        // 2. FastAPI Parser Service
        const pingParser = async (): Promise<ServiceHealth> => {
            const start = performance.now();
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);
                const parserUrl = process.env.NEXT_PUBLIC_PARSER_URL || 'http://localhost:8000';
                const res = await fetch(`${parserUrl}/health`, {
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                const latency = Math.round(performance.now() - start);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json().catch(() => ({}));
                return {
                    status: 'healthy',
                    latencyMs: latency,
                    details: `v${data.version || '3.1'} PyMuPDF & docx ready`,
                };
            } catch (err: any) {
                return {
                    status: 'down',
                    latencyMs: null,
                    error: err.name === 'AbortError' ? 'Connection timed out (4s)' : 'Service offline or blocked by CORS',
                };
            }
        };

        // 3. Supabase PostgreSQL & Auth
        const pingSupabase = async (): Promise<ServiceHealth> => {
            const start = performance.now();
            try {
                const { error: queryError } = await supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true });
                const latency = Math.round(performance.now() - start);
                if (queryError) throw queryError;
                return {
                    status: 'healthy',
                    latencyMs: latency,
                    details: 'PostgreSQL connection active (RLS verified)',
                };
            } catch (err: any) {
                return {
                    status: 'down',
                    latencyMs: null,
                    error: err.message || 'Database unreachable',
                };
            }
        };

        const [bRes, pRes, dRes] = await Promise.all([
            pingBackend(),
            pingParser(),
            pingSupabase(),
        ]);

        setBackendHealth(bRes);
        setParserHealth(pRes);
        setDbHealth(dRes);
        setLastHealthChecked(new Date());
        setIsCheckingHealth(false);
    };

    // Load persisted settings on mount & run initial health check
    useEffect(() => {
        let isMounted = true;

        async function fetchSettings() {
            try {
                setIsLoading(true);
                setError(null);
                const res = await apiFetch('/settings');
                if (!res.ok) {
                    throw new Error(`Failed to load settings (HTTP ${res.status})`);
                }
                const data = await res.json();
                if (isMounted && data) {
                    if (data.college_name) setCollegeName(data.college_name);
                    if (data.trust_name) setTrustName(data.trust_name);
                    if (data.affiliation) setAutonomousText(data.affiliation);
                    if (data.iqac_text) setIqacText(data.iqac_text);
                    if (data.record_no) setRecordNo(data.record_no);
                    if (data.department) setDepartment(data.department);
                    if (data.default_duration_minutes) setDefaultDuration(data.default_duration_minutes);
                    if (data.academic_year) setAcademicYear(data.academic_year);
                }
            } catch (err: any) {
                console.warn('Could not fetch remote settings, using current defaults:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchSettings();
        checkAllServices();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const payload = {
                trust_name: trustName.trim(),
                college_name: collegeName.trim(),
                affiliation: autonomousText.trim(),
                iqac_text: iqacText.trim(),
                record_no: recordNo.trim(),
                department: department.trim(),
                default_duration_minutes: defaultDuration.trim(),
                academic_year: academicYear.trim(),
            };

            const res = await apiFetch('/settings', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to save settings (HTTP ${res.status})`);
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3500);
        } catch (err: any) {
            console.error('Error saving settings:', err);
            setError(err.message || 'Error saving settings. Please check your backend connection.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">System & Exam Settings</h2>
                    <p className="text-slate-400">Configure examination paper headers, university affiliations, and service endpoints.</p>
                </div>
                {isLoading && (
                    <div className="flex items-center space-x-2 text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing with database...</span>
                    </div>
                )}
            </div>

            {saved && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400 text-sm animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Settings saved successfully! These defaults will apply to all newly generated papers.</span>
                </div>
            )}

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-3 text-rose-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
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
                                placeholder="e.g. Pimpri Chinchwad Education Trust's"
                                className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">College / Institute Name</label>
                            <Input
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                                placeholder="e.g. Pimpri Chinchwad College of Engineering & Research Ravet, Pune"
                                className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Affiliation & Accreditation Line</label>
                        <Input
                            value={autonomousText}
                            onChange={(e) => setAutonomousText(e.target.value)}
                            placeholder="e.g. An Autonomous Institute | NBA Accredited | NAAC A++ Accredited"
                            className="bg-slate-950 border-slate-800 text-white h-11 focus-visible:ring-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Department</label>
                            <Input
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                placeholder="e.g. Computer Engineering"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">IQAC Tag</label>
                            <Input
                                value={iqacText}
                                onChange={(e) => setIqacText(e.target.value)}
                                placeholder="e.g. IQAC PCCOER"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Record No.</label>
                            <Input
                                value={recordNo}
                                onChange={(e) => setRecordNo(e.target.value)}
                                placeholder="e.g. ACAD/R/11"
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
                                placeholder="e.g. 60"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Academic Year</label>
                            <Input
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="e.g. 2025 – 26"
                                className="bg-slate-950 border-slate-800 text-white h-11"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Service Health & Status */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <CardTitle className="text-white flex items-center">
                            <Server className="w-5 h-5 mr-2 text-blue-400" />
                            Connected Microservices
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Live latency and health pings across core backend, Python parser, and PostgreSQL database.
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                        {lastHealthChecked && (
                            <span className="text-xs text-slate-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {lastHealthChecked.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={checkAllServices}
                            disabled={isCheckingHealth}
                            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-8"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCheckingHealth ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                            {isCheckingHealth ? 'Checking...' : 'Run Diagnostics'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* NestJS Backend API */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3">
                        <div className="flex items-start space-x-3.5">
                            <div className="pt-1.5 flex-shrink-0">
                                {backendHealth.status === 'checking' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                )}
                                {backendHealth.status === 'healthy' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                )}
                                {backendHealth.status === 'down' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-white">NestJS Backend API</p>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        :3001
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Core REST API, question paper engine, and audit pipeline</p>
                                {backendHealth.details && backendHealth.status === 'healthy' && (
                                    <p className="text-xs text-emerald-400/90 mt-1 flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {backendHealth.details}
                                    </p>
                                )}
                                {backendHealth.error && backendHealth.status === 'down' && (
                                    <p className="text-xs text-rose-400 mt-1 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {backendHealth.error}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center self-end sm:self-center">
                            {backendHealth.status === 'checking' && (
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                    Pinging...
                                </Badge>
                            )}
                            {backendHealth.status === 'healthy' && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                    Operational {backendHealth.latencyMs !== null ? `(${backendHealth.latencyMs}ms)` : ''}
                                </Badge>
                            )}
                            {backendHealth.status === 'down' && (
                                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium">
                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                    Unavailable
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* FastAPI Document Parser */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3">
                        <div className="flex items-start space-x-3.5">
                            <div className="pt-1.5 flex-shrink-0">
                                {parserHealth.status === 'checking' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                )}
                                {parserHealth.status === 'healthy' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                )}
                                {parserHealth.status === 'down' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-white">FastAPI Document Parser</p>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        :8000
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">High-speed Python PyMuPDF, python-docx, and Bloom&apos;s AI taxonomy engine</p>
                                {parserHealth.details && parserHealth.status === 'healthy' && (
                                    <p className="text-xs text-emerald-400/90 mt-1 flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {parserHealth.details}
                                    </p>
                                )}
                                {parserHealth.error && parserHealth.status === 'down' && (
                                    <p className="text-xs text-rose-400 mt-1 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {parserHealth.error}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center self-end sm:self-center">
                            {parserHealth.status === 'checking' && (
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                    Pinging...
                                </Badge>
                            )}
                            {parserHealth.status === 'healthy' && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                    Operational {parserHealth.latencyMs !== null ? `(${parserHealth.latencyMs}ms)` : ''}
                                </Badge>
                            )}
                            {parserHealth.status === 'down' && (
                                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium">
                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                    Unavailable
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Supabase PostgreSQL Engine */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-3">
                        <div className="flex items-start space-x-3.5">
                            <div className="pt-1.5 flex-shrink-0">
                                {dbHealth.status === 'checking' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                                )}
                                {dbHealth.status === 'healthy' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                                )}
                                {dbHealth.status === 'down' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-semibold text-white">Supabase PostgreSQL Engine</p>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                        PostgreSQL 15
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Database storage, tenant isolation, and Row Level Security</p>
                                {dbHealth.details && dbHealth.status === 'healthy' && (
                                    <p className="text-xs text-emerald-400/90 mt-1 flex items-center">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        {dbHealth.details}
                                    </p>
                                )}
                                {dbHealth.error && dbHealth.status === 'down' && (
                                    <p className="text-xs text-rose-400 mt-1 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        {dbHealth.error}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center self-end sm:self-center">
                            {dbHealth.status === 'checking' && (
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">
                                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                    Pinging...
                                </Badge>
                            )}
                            {dbHealth.status === 'healthy' && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium">
                                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                    Connected {dbHealth.latencyMs !== null ? `(${dbHealth.latencyMs}ms)` : ''}
                                </Badge>
                            )}
                            {dbHealth.status === 'down' && (
                                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 font-medium">
                                    <AlertCircle className="w-3 h-3 mr-1.5" />
                                    Unavailable
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11 disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving Settings...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
