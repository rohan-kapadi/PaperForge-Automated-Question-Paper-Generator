'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (authError) throw authError;

            setIsSuccess(true);
            // Optionally redirect after a delay or show success state
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to sign up. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 relative overflow-hidden font-sans">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />
                <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl text-center p-8">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Account Created!</CardTitle>
                    <CardDescription className="text-slate-400 mb-6">
                        Welcome to ExamGen. We're redirecting you to your dashboard...
                    </CardDescription>
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                </Card>
            </div>
        );
    }

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
                        <CardTitle className="text-2xl text-center text-white">Create an Account</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            Enter your details to get started with ExamGen
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
                                <label htmlFor="fullName" className="text-sm font-medium text-slate-300">
                                    Full Name
                                </label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Dr. John Doe"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

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

                            <Button 
                                type="submit" 
                                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold h-11" 
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    'Sign Up'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-400">Already have an account? </span>
                            <Link href="/login" className="text-amber-500 font-medium hover:text-amber-400 transition-colors hover:underline">
                                Login
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-slate-500 mt-6">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
