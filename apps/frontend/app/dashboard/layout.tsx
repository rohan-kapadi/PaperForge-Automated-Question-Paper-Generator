'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Upload,
    Library,
    ListChecks,
    ClipboardList,
    Sparkles,
    FileText,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: Upload, label: 'Upload Question Bank', href: '/dashboard/upload' },
    { icon: Library, label: 'Question Library', href: '/dashboard/library' },
    { icon: ListChecks, label: 'Manual Selection', href: '/dashboard/manual' },
    { icon: ClipboardList, label: 'Blueprint Builder', href: '/dashboard/blueprint' },
    { icon: Sparkles, label: 'Auto Generate', href: '/dashboard/auto' },
    { icon: FileText, label: 'Generated Papers', href: '/dashboard/generated' },
    { icon: History, label: 'Audit Logs', href: '/dashboard/audit' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        router.push('/login');
    };

    const currentPage = menuItems.find(item => item.href === pathname)?.label || 'Dashboard';

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 shadow-2xl',
                    sidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                        {sidebarOpen ? (
                            <>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <FileText className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <span className="text-xl font-bold text-white tracking-tight">ExamGen</span>
                                </div>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-1.5 hover:bg-slate-800 rounded-lg mx-auto text-slate-400 hover:text-white transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3">
                        <ul className="space-y-1">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 group',
                                                isActive
                                                    ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )}
                                        >
                                            <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-slate-900' : 'group-hover:text-amber-400', sidebarOpen ? '' : 'mx-auto')} />
                                            {sidebarOpen && (
                                                <span>{item.label}</span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Profile (Bottom Sidebar) */}
                    <div className="p-4 border-t border-slate-800">
                        <div className={cn("flex items-center", sidebarOpen ? "justify-between" : "justify-center")}>
                            {sidebarOpen && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center border border-slate-600">
                                        <User className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-medium text-white">Dr. Sharma</p>
                                        <p className="text-xs text-slate-500">Free Plan</p>
                                    </div>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-400 hover:bg-slate-800"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div
                className={cn(
                    'transition-all duration-300 relative z-10',
                    sidebarOpen ? 'ml-64' : 'ml-20'
                )}
            >
                {/* Top Bar */}
                <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
                    <div className="h-full px-8 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-white tracking-tight">{currentPage}</h1>

                        <div className="flex items-center space-x-4">
                            <div className="bg-slate-800/50 rounded-full px-4 py-1.5 border border-slate-700 flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-slate-300">System Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8 bg-slate-950 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}
