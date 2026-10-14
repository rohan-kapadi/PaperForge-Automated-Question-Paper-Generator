'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard,
    Database,
    Library,
    ClipboardList,
    Sparkles,
    FileText,
    History,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Shield,
    ShieldAlert
} from 'lucide-react';
import { AuthProvider, useAuth, UserRole } from '@/lib/auth-context';

interface NavItem {
    icon: any;
    label: string;
    href: string;
    badge?: string;
    highlight?: boolean;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'OVERVIEW',
        items: [
            { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
        ],
    },
    {
        title: 'GENERATE',
        items: [
            { icon: Sparkles, label: 'Generate Paper', href: '/dashboard/generate', badge: 'Primary', highlight: true },
        ],
    },
    {
        title: 'LIBRARY',
        items: [
            { icon: Database, label: 'Question Banks', href: '/dashboard/banks' },
            { icon: Library, label: 'Question Library', href: '/dashboard/library' },
            { icon: ClipboardList, label: 'Blueprints', href: '/dashboard/blueprints' },
            { icon: FileText, label: 'Generated Papers', href: '/dashboard/generated' },
        ],
    },
    {
        title: 'SYSTEM',
        items: [
            { icon: History, label: 'Audit Logs', href: '/dashboard/audit' },
            { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
        ],
    },
];

const allNavItems = navGroups.flatMap(g => g.items);

function DashboardInnerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, profile, role, isHODOrAdmin, roleOverride, setRoleOverride, signOut, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const getPageTitle = () => {
        const matched = allNavItems.find(item => item.href === pathname);
        if (matched) return matched.label;
        if (pathname === '/dashboard/auto') return 'Auto Generate (Legacy)';
        if (pathname === '/dashboard/manual') return 'Manual Selection';
        if (pathname === '/dashboard/upload') return 'Upload Question Bank';
        if (pathname === '/dashboard/blueprint') return 'Blueprint Builder';
        return 'Dashboard';
    };

    const currentPage = getPageTitle();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
            {/* Background Grid */}
            <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] pointer-events-none" />

            {/* Mobile Backdrop Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 shadow-2xl',
                    sidebarOpen
                        ? 'w-64 translate-x-0'
                        : '-translate-x-full md:translate-x-0 md:w-20'
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                        {sidebarOpen ? (
                            <>
                                <Link href="/dashboard" className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                                        <FileText className="w-5 h-5 text-slate-900" />
                                    </div>
                                    <span className="text-xl font-bold text-white tracking-tight">ExamGen</span>
                                </Link>
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
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                        {navGroups.map((group) => (
                            <div key={group.title} className="space-y-1">
                                {sidebarOpen && (
                                    <p className="px-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                                        {group.title}
                                    </p>
                                )}
                                <ul className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm relative',
                                                        isActive
                                                            ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20'
                                                            : item.highlight
                                                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300 font-medium'
                                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        'w-4 h-4 transition-colors flex-shrink-0',
                                                        isActive 
                                                            ? 'text-slate-900' 
                                                            : item.highlight
                                                            ? 'text-amber-400'
                                                            : 'group-hover:text-amber-400',
                                                        sidebarOpen ? '' : 'mx-auto'
                                                    )} />
                                                    {sidebarOpen && (
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                    )}
                                                    {sidebarOpen && item.badge && !isActive && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    {/* User Profile & Role (Bottom Sidebar) */}
                    <div className="p-4 border-t border-slate-800 space-y-2">
                        <div className={cn("flex items-center", sidebarOpen ? "justify-between" : "justify-center")}>
                            {sidebarOpen && (
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shrink-0">
                                        <User className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-sm truncate">
                                        <p className="font-medium text-white truncate max-w-[120px]">
                                            {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Faculty'}
                                        </p>
                                        <div className="flex items-center space-x-1 mt-0.5">
                                            <Badge className={cn(
                                                "text-[9px] px-1.5 py-0 font-bold uppercase",
                                                role === 'Admin' ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                                                role === 'HOD' ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                                                "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                            )}>
                                                {role}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-400 hover:bg-slate-800 shrink-0"
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
                    'ml-0',
                    sidebarOpen ? 'md:ml-64' : 'md:ml-20'
                )}
            >
                {/* Top Bar */}
                <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
                    <div className="h-full px-4 sm:px-6 md:px-8 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
                                title="Toggle Navigation Menu"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{currentPage}</h1>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Role Switcher (Live Testing for HOD vs Teacher) */}
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-2 sm:px-2.5 py-1 flex items-center space-x-1.5 sm:space-x-2 text-xs">
                                <span className="text-slate-500 font-medium hidden sm:flex items-center gap-1">
                                    <Shield className="w-3.5 h-3.5 text-amber-400" /> Role:
                                </span>
                                <select
                                    value={role}
                                    onChange={(e) => setRoleOverride(e.target.value as UserRole)}
                                    className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    title="Switch active role for testing moderation permissions"
                                >
                                    <option value="Teacher">Teacher</option>
                                    <option value="HOD">HOD</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            <div className="bg-slate-800/50 rounded-full px-3 sm:px-4 py-1.5 border border-slate-700 flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-slate-300 hidden sm:inline">System Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 sm:p-6 md:p-8 bg-slate-950 min-h-[calc(100vh-4rem)]">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DashboardInnerLayout>
                {children}
            </DashboardInnerLayout>
        </AuthProvider>
    );
}
