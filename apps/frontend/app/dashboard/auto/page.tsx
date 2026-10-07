'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AutoGeneratePage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/dashboard/generate');
        }, 1200);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse shadow-lg shadow-amber-500/20">
                <Sparkles className="w-8 h-8" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Upgraded to Generate Paper</h2>
                <p className="text-sm text-slate-400">
                    Auto Generate is now part of the unified, multi-step <strong>Generate Paper</strong> workflow with smart recommendations and live contextual review.
                </p>
            </div>
            <Link href="/dashboard/generate">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 h-11 shadow-lg shadow-amber-500/20">
                    Go to Generate Paper <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Link>
        </div>
    );
}
