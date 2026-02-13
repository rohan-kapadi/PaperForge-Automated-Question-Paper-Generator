'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock login - redirect to dashboard
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />

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
                            Enter your credentials to access your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="professor@university.edu"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
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

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center space-x-2 cursor-pointer group">
                                    <input type="checkbox" className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20" />
                                    <span className="text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                                </label>
                                <a href="#" className="text-amber-500 hover:text-amber-400 transition-colors hover:underline">
                                    Forgot password?
                                </a>
                            </div>

                            <Button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold h-11" size="lg">
                                Login
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

                <p className="text-center text-sm text-slate-500 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
