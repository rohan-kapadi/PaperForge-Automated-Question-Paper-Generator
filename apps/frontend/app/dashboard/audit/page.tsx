'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, User, FileText, Settings, ShieldCheck } from 'lucide-react';

export default function AuditLogsPage() {
    const logs = [
        {
            id: 1,
            user: 'Dr. Sharma',
            action: 'Generated Paper',
            details: 'Database Management Systems - Mid Term',
            timestamp: '2 hours ago',
            icon: FileText,
            color: 'text-emerald-400 bg-emerald-500/10'
        },
        {
            id: 2,
            user: 'Dr. Sharma',
            action: 'File Upload',
            details: 'DBMS_Questions.xlsx uploaded successfully',
            timestamp: '5 hours ago',
            icon: Activity,
            color: 'text-blue-400 bg-blue-500/10'
        },
        {
            id: 3,
            user: 'System Admin',
            action: 'System Update',
            details: 'Updated question bank parser rules',
            timestamp: '1 day ago',
            icon: Settings,
            color: 'text-purple-400 bg-purple-500/10'
        },
        {
            id: 4,
            user: 'Dr. Sharma',
            action: 'Login',
            details: 'Successful login from IP 192.168.1.1',
            timestamp: '1 day ago',
            icon: ShieldCheck,
            color: 'text-amber-400 bg-amber-500/10'
        },
        {
            id: 5,
            user: 'Dr. Sharma',
            action: 'Modified Question',
            details: 'Edited Question #1245 in Unit 3',
            timestamp: '2 days ago',
            icon: FileText,
            color: 'text-slate-400 bg-slate-500/10'
        }
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">Audit Log</h2>
                <p className="text-slate-400">Track all activities and system changes.</p>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-800 pb-4">
                    <CardTitle className="text-white flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-slate-400" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="relative border-l border-slate-800 ml-3 space-y-8">
                        {logs.map((log) => {
                            const Icon = log.icon;
                            return (
                                <div key={log.id} className="relative pl-8 group">
                                    <div className={`absolute -left-[17px] top-1 w-9 h-9 rounded-full border-4 border-slate-950 flex items-center justify-center ${log.color} transition-transform group-hover:scale-110`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg hover:bg-slate-900/50 transition-colors -mt-2">
                                        <div>
                                            <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                                                {log.action}
                                                <span className="text-slate-500 font-normal text-sm ml-2">by {log.user}</span>
                                            </h4>
                                            <p className="text-sm text-slate-400 mt-1">{log.details}</p>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono whitespace-nowrap bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                            {log.timestamp}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
