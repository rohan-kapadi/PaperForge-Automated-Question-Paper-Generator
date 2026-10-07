'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, FileText, Settings, ShieldCheck, RefreshCw, AlertCircle, Upload, Brain, Loader2 } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface AuditLog {
    id: string | number;
    action: string;
    action_code: string;
    details: string;
    user: string;
    ip_address: string;
    created_at: string;
    timestamp: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers — map action_code → icon + colour
// ──────────────────────────────────────────────────────────────────────────────

function getActionStyle(actionCode: string): { Icon: React.ElementType; color: string } {
    switch (actionCode) {
        case 'PAPER_GENERATED':
        case 'PAPER_STATUS_UPDATED':
        case 'PAPER_APPROVED':
            return { Icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
        case 'FILE_UPLOAD':
        case 'QUESTION_BANK_UPLOADED':
            return { Icon: Upload, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
        case 'BLUEPRINT_CREATED':
            return { Icon: FileText, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' };
        case 'METADATA_ANALYZED':
        case 'QUESTION_OVERRIDDEN':
        case 'QUESTION_MODIFIED':
            return { Icon: Brain, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
        case 'LOGIN':
            return { Icon: ShieldCheck, color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' };
        case 'SYSTEM_INIT':
        case 'SYSTEM_UPDATE':
            return { Icon: Settings, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
        default:
            return { Icon: Activity, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:3001/audit-logs?limit=100');
            if (!res.ok) throw new Error(`Server returned ${res.status}`);
            const data = await res.json();
            setLogs(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    // ── Render states ──────────────────────────────────────────────────────────

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Loading audit logs…</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-sm font-medium">{error}</p>
                    <button
                        onClick={() => fetchLogs()}
                        className="mt-2 px-4 py-1.5 text-xs rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            );
        }

        if (logs.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
                    <Activity className="w-8 h-8" />
                    <p className="text-sm">No audit logs found yet.</p>
                </div>
            );
        }

        return (
            <div className="relative border-l border-slate-800 ml-3 space-y-8">
                {logs.map((log) => {
                    const { Icon, color } = getActionStyle(log.action_code);
                    return (
                        <div key={log.id} className="relative pl-8 group">
                            {/* Timeline dot */}
                            <div className={`absolute -left-[17px] top-1 w-9 h-9 rounded-full border-4 border-slate-950 flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
                                <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg hover:bg-slate-900/50 transition-colors -mt-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                                        {log.action}
                                        <span className="text-slate-500 font-normal text-sm ml-2">
                                            by {log.user}
                                        </span>
                                    </h4>
                                    <p className="text-sm text-slate-400 mt-1 truncate">{log.details}</p>
                                    {log.ip_address && log.ip_address !== '127.0.0.1' && (
                                        <p className="text-xs text-slate-600 mt-0.5">IP: {log.ip_address}</p>
                                    )}
                                </div>
                                <span className="text-xs text-slate-500 font-mono whitespace-nowrap bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                    {log.timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Audit Log</h2>
                    <p className="text-slate-400">Track all activities and system changes.</p>
                </div>
                <button
                    onClick={() => fetchLogs(true)}
                    disabled={refreshing || loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats bar */}
            {!loading && !error && logs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Events', value: logs.length, color: 'text-white' },
                        { label: 'Uploads', value: logs.filter(l => l.action_code === 'FILE_UPLOAD' || l.action_code === 'QUESTION_BANK_UPLOADED').length, color: 'text-blue-400' },
                        { label: 'Papers', value: logs.filter(l => l.action_code === 'PAPER_GENERATED').length, color: 'text-emerald-400' },
                        { label: 'Blueprints', value: logs.filter(l => l.action_code === 'BLUEPRINT_CREATED').length, color: 'text-violet-400' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Timeline card */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-800 pb-4">
                    <CardTitle className="text-white flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-slate-400" />
                        Recent Activity
                        {!loading && !error && (
                            <Badge className="ml-3 bg-slate-800 text-slate-400 text-xs border-slate-700">
                                {logs.length} events
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}
