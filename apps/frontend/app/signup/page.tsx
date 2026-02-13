'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        department: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock signup - redirect to dashboard
        router.push('/dashboard');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12 relative overflow-hidden font-sans">
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
                        <CardTitle className="text-2xl text-center text-white">Create Account</CardTitle>
                        <CardDescription className="text-center text-slate-400">
                            Join ExamGen to start creating professional examination papers
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="text-sm font-medium text-slate-300">
                                    Full Name
                                </label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Dr. John Doe"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="professor@university.edu"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="text-sm font-medium text-slate-300">
                                    Department
                                </label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    className="flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 text-white px-4 py-2 text-sm ring-offset-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-slate-600"
                                >
                                    <option value="">Select Department</option>
                                    <option value="computer-science">Computer Science</option>
                                    <option value="information-technology">Information Technology</option>
                                    <option value="electronics">Electronics Engineering</option>
                                    <option value="mechanical">Mechanical Engineering</option>
                                    <option value="civil">Civil Engineering</option>
                                    <option value="mathematics">Mathematics</option>
                                    <option value="physics">Physics</option>
                                    <option value="chemistry">Chemistry</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
                                    Confirm Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-amber-500"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold h-11" size="lg">
                                Create Account
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
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
