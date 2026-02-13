'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, FileQuestion, FileText, Activity, ArrowRight, Upload, Sparkles, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

export default function DashboardPage() {
    const stats = [
        {
            icon: Database,
            label: 'Question Banks',
            value: '12',
            change: '+2 this month',
            color: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        },
        {
            icon: FileQuestion,
            label: 'Total Questions',
            value: '1,247',
            change: '+156 this month',
            color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        },
        {
            icon: FileText,
            label: 'Papers Generated',
            value: '38',
            change: '+5 this week',
            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        },
        {
            icon: Activity,
            label: 'Active Blueprints',
            value: '6',
            change: '2 in draft',
            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        }
    ];

    const recentActivity = [
        {
            action: 'Generated Paper',
            title: 'Database Management Systems - Mid Term',
            time: '2 hours ago',
            status: 'success'
        },
        {
            action: 'Uploaded Question Bank',
            title: 'DBMS_Questions.xlsx',
            time: '5 hours ago',
            status: 'success'
        },
        {
            action: 'Created Blueprint',
            title: 'End-Term Examination Blueprint',
            time: '1 day ago',
            status: 'success'
        },
        {
            action: 'Modified Questions',
            title: 'Unit 3 - Advanced Topics',
            time: '2 days ago',
            status: 'warning'
        },
        {
            action: 'Downloaded Paper',
            title: 'Operating Systems - End Term',
            time: '3 days ago',
            status: 'success'
        }
    ];

    return (
        <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="space-y-8"
        >

            {/* Welcome Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Overview</h2>
                    <p className="text-slate-400">Welcome back, Dr. Sharma. Here&apos;s what&apos;s happening.</p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/dashboard/auto">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl flex items-center transition-colors shadow-lg shadow-amber-500/20"
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate Paper
                        </motion.button>
                    </Link>
                    <Link href="/dashboard/upload">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl border border-slate-700 flex items-center transition-colors"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
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
                                    <div className="text-3xl font-bold text-white group-hover:text-amber-400 transition-colors">{stat.value}</div>
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
                            <CardDescription className="text-slate-400">Your latest actions and updates</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivity.map((activity, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <Badge className={
                                                    activity.status === 'success' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                                        'text-amber-400 border-amber-500/20 bg-amber-500/10'
                                                }>
                                                    {activity.action}
                                                </Badge>
                                                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">{activity.title}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm text-slate-500">{activity.time}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Actions / Shortcuts */}
                <motion.div variants={item}>
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm shadow-xl h-full">
                        <CardHeader>
                            <CardTitle className="text-white">Quick Access</CardTitle>
                            <CardDescription className="text-slate-400">Frequent tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/dashboard/upload">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400 group-hover:text-blue-300">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-300 group-hover:text-white">Upload Files</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                </motion.div>
                            </Link>

                            <Link href="/dashboard/blueprint">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 group-hover:text-purple-300">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-300 group-hover:text-white">New Blueprint</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                </motion.div>
                            </Link>

                            <Link href="/dashboard/library">
                                <motion.div
                                    whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                                    className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-amber-500/10 p-2 rounded-lg text-amber-400 group-hover:text-amber-300">
                                            <Database className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-slate-300 group-hover:text-white">Question Library</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                                </motion.div>
                            </Link>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
