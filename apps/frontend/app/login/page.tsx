'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, AlertCircle, ShieldCheck, BookOpen, GraduationCap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getRoleFromEmail, getDashboardPathForRole } from '@/lib/auth-context';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Determine role from email and redirect accordingly
            const role = getRoleFromEmail(email) ?? 'Teacher';
            const redirectPath = getDashboardPathForRole(role);
            router.push(redirectPath);
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    // Derive a subtle role hint from the email typed (just for UX)
    const typedRole = email ? getRoleFromEmail(email) : null;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />

            {/* Ambient glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="flex items-center justify-center space-x-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <FileText className="w-7 h-7 text-slate-900" />
                    </div>
                    <span className="text-3xl font-bold text-white tracking-tight">ExamGen</span>
                </div>

                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center text-white">Welcome Back</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            Enter your credentials to access your dashboard
                        </CardDescription>
                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-2 text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="professor@pccoer.edu"
                                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500 pr-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    {typedRole && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {typedRole === 'HOD' && <span title="HOD Account"><ShieldCheck className="w-4 h-4 text-amber-400" /></span>}
                                            {typedRole === 'ExamSection' && <span title="Exam Section Account"><BookOpen className="w-4 h-4 text-blue-400" /></span>}
                                            {typedRole === 'Admin' && <span title="Admin Account"><ShieldCheck className="w-4 h-4 text-purple-400" /></span>}
                                        </div>
                                    )}
                                </div>
                                {typedRole && (
                                    <p className={`text-xs flex items-center gap-1 ${
                                        typedRole === 'HOD' ? 'text-amber-400' :
                                        typedRole === 'ExamSection' ? 'text-blue-400' :
                                        'text-purple-400'
                                    }`}>
                                        {typedRole === 'HOD' && <><ShieldCheck className="w-3 h-3" /> Recognized as HOD — will redirect to approval dashboard</>}
                                        {typedRole === 'ExamSection' && <><BookOpen className="w-3 h-3" /> Recognized as Exam Section — will redirect to exam papers dashboard</>}
                                        {typedRole === 'Admin' && <><ShieldCheck className="w-3 h-3" /> Recognized as Admin</>}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold h-11"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-400">Don&apos;t have an account? </span>
                            <Link href="/signup" className="text-amber-500 font-medium hover:text-amber-400 transition-colors hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Role hint cards */}
                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                        <GraduationCap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">Teachers</p>
                        <p className="text-[10px] text-slate-600">Generate papers</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">HOD</p>
                        <p className="text-[10px] text-slate-600">Review & approve</p>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5">
                        <BookOpen className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-[10px] text-slate-400 font-medium">Exam Section</p>
                        <p className="text-[10px] text-slate-600">Print & manage</p>
                    </div>
                </div>

                <p className="text-center text-sm text-slate-500 mt-4">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
