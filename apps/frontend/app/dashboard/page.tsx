'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileQuestion, FileText, Activity, ArrowRight, Upload, Sparkles, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface OverviewData {
    questionBanks: number;
    totalQuestions: number;
    papersGenerated: number;
    activeBlueprints: number;
    recentActivity: Array<{
        action: string;
        title: string;
        date: string;
        status: string;
    }>;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [statsData, setStatsData] = useState<OverviewData | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            setUser(authUser);
        };
        getUser();

        const fetchOverviewStats = async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStatsData(data);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchOverviewStats();
    }, []);

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 30) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const stats = [
        {
            icon: Database,
            label: 'Question Banks',
            value: statsData ? statsData.questionBanks.toString() : '0',
            change: statsData?.questionBanks ? `${statsData.questionBanks} active in database` : 'Ready for upload',
            color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        },
        {
            icon: FileQuestion,
            label: 'Total Questions',
            value: statsData ? statsData.totalQuestions.toLocaleString() : '0',
            change: statsData?.totalQuestions ? `${statsData.totalQuestions} questions classified` : '0 questions',
            color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        },
        {
            icon: FileText,
            label: 'Papers Generated',
            value: statsData ? statsData.papersGenerated.toString() : '0',
            change: statsData?.papersGenerated ? `${statsData.papersGenerated} papers saved` : 'Generate your first paper',
            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        },
        {
            icon: Activity,
            label: 'Active Blueprints',
            value: statsData ? statsData.activeBlueprints.toString() : '0',
            change: statsData?.activeBlueprints ? `${statsData.activeBlueprints} exam templates` : 'Create new blueprint',
            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        }
    ];

    const recentActivity = statsData?.recentActivity && statsData.recentActivity.length > 0
        ? statsData.recentActivity.map(act => ({
            action: act.action,
            title: act.title,
            time: formatTimeAgo(act.date),
            status: act.status
        }))
        : [
            {
                action: 'System Ready',
                title: 'Question Intelligence & Blueprint Engine online',
                time: 'Just now',
                status: 'success'
            }
        ];

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="space-y-8 max-w-7xl mx-auto pb-16"
        >
            {/* Welcome Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Overview</h2>
                    <p className="text-slate-400">
                        Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Faculty'}. 
                        Here is your live examination intelligence summary.
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/dashboard/generate">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-2.5 rounded-xl flex items-center transition-colors shadow-lg shadow-amber-500/25 text-sm"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Paper
                        </motion.button>
                    </Link>
                    <Link href="/dashboard/banks">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2.5 rounded-xl border border-slate-700 flex items-center transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Bank
                        </motion.button>
                    </Link>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={index} variants={item}>
                            <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm group overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-400">
                                        {stat.label}
                                    </CardTitle>
                                    <motion.div
                                        whileHover={{ rotate: 10, scale: 1.1 }}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${stat.color}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </motion.div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">
                                        {isLoadingStats ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mt-1" />
                                        ) : (
                                            stat.value
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl h-full">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Activity</CardTitle>
                            <CardDescription className="text-slate-400">Live actions recorded from your database</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoadingStats ? (
                                    <div className="py-8 text-center text-slate-500 text-sm">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
                                        Loading recent activity...
                                    </div>
                                ) : (
                                    recentActivity.map((activity, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
                                        >
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center space-x-3">
                                                    <Badge className={
                                                        activity.status === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                                            'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                                    }>
                                                        {activity.action}
                                                    </Badge>
                                                    <span className="font-medium text-slate-200 group-hover:text-white transition-colors text-sm truncate">
                                                        {activity.title}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">{activity.time}</span>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions / Shortcuts */}
                <motion.div variants={item}>
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl h-full">
                        <CardHeader>
                            <CardTitle className="text-white">Quick Actions</CardTitle>
                            <CardDescription className="text-slate-400">Primary examination workflows</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Dominant Primary Action: Generate Paper */}
                            <Link href="/dashboard/generate">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(245, 158, 11, 0.12)' }}
                                    className="p-4 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-950/60 border border-amber-500/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-lg shadow-amber-500/10"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-amber-500 p-2 rounded-lg text-slate-950 shadow-md shadow-amber-500/30">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-white group-hover:text-amber-400 transition-colors block">
                                                Generate Paper
                                            </span>
                                            <span className="text-xs text-slate-400">Start a new examination paper</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                </motion.div>
                            </Link>

                            {/* Secondary Action: Upload Question Bank */}
                            <Link href="/dashboard/banks">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:text-blue-300">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-200 group-hover:text-white block">
                                                Upload Question Bank
                                            </span>
                                            <span className="text-xs text-slate-400">Add questions to your library</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                </motion.div>
                            </Link>

                            {/* Tertiary Action: Create Blueprint */}
                            <Link href="/dashboard/blueprints">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 group-hover:text-purple-300">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-200 group-hover:text-white block">
                                                Create Blueprint
                                            </span>
                                            <span className="text-xs text-slate-400">Define an examination structure</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                </motion.div>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
