'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlueprintBuilderPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/blueprints');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-2">
                <p className="text-slate-400 text-sm">Redirecting to Blueprints...</p>
            </div>
        </div>
    );
}
