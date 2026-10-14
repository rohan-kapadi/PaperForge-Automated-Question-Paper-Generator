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
    ShieldCheck,
    CheckCircle,
    BookOpen,
    Printer,
    Clock,
    XCircle,
} from 'lucide-react';
import { AuthProvider, useAuth, UserRole, getDashboardPathForRole } from '@/lib/auth-context';

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

// Nav items for Teachers (default)
const teacherNavGroups: NavGroup[] = [
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
            { icon: FileText, label: 'My Papers', href: '/dashboard/generated' },
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

// Nav items for HOD
const hodNavGroups: NavGroup[] = [
    {
        title: 'OVERVIEW',
        items: [
            { icon: LayoutDashboard, label: 'Approval Queue', href: '/dashboard/hod', highlight: true },
        ],
    },
    {
        title: 'APPROVALS',
        items: [
            { icon: Clock, label: 'Pending Approvals', href: '/dashboard/hod?tab=pending', badge: '!' },
            { icon: CheckCircle, label: 'Approved Papers', href: '/dashboard/hod?tab=approved' },
            { icon: XCircle, label: 'Rejected Papers', href: '/dashboard/hod?tab=rejected' },
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

// Nav items for Exam Section
const examSectionNavGroups: NavGroup[] = [
    {
        title: 'OVERVIEW',
        items: [
            { icon: LayoutDashboard, label: 'Exam Dashboard', href: '/dashboard/examsection', highlight: true },
        ],
    },
    {
        title: 'PRINTING',
        items: [
            { icon: CheckCircle, label: 'All Approved', href: '/dashboard/examsection?filter=all' },
            { icon: FileText, label: 'Ready to Print', href: '/dashboard/examsection?filter=not_printed' },
            { icon: Printer, label: 'Print Queue', href: '/dashboard/examsection?filter=in_queue' },
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

function getNavGroupsForRole(role: UserRole): NavGroup[] {
    if (role === 'HOD' || role === 'Admin') return hodNavGroups;
    if (role === 'ExamSection') return examSectionNavGroups;
    return teacherNavGroups;
}

function getRoleAccentColor(role: UserRole) {
    if (role === 'HOD') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (role === 'ExamSection') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (role === 'Admin') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
}

function getRoleIcon(role: UserRole) {
    if (role === 'HOD' || role === 'Admin') return ShieldCheck;
    if (role === 'ExamSection') return BookOpen;
    return User;
}

function DashboardInnerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, profile, role, isLoading, signOut } = useAuth();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // On first load after auth, redirect HOD/ExamSection to their correct home if they land on /dashboard
    useEffect(() => {
        if (!isLoading && user && pathname === '/dashboard') {
            const target = getDashboardPathForRole(role);
            if (target !== '/dashboard') {
                router.replace(target);
            }
        }
    }, [isLoading, user, role, pathname, router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/login');
    };

    const navGroups = getNavGroupsForRole(role);
    const allNavItems = navGroups.flatMap(g => g.items);

    const getPageTitle = () => {
        const matched = allNavItems.find(item => item.href === pathname);
        if (matched) return matched.label;
        if (pathname === '/dashboard/auto') return 'Auto Generate (Legacy)';
        if (pathname === '/dashboard/manual') return 'Manual Selection';
        if (pathname === '/dashboard/upload') return 'Upload Question Bank';
        if (pathname === '/dashboard/blueprint') return 'Blueprint Builder';
        if (pathname.startsWith('/dashboard/hod')) return 'HOD Dashboard';
        if (pathname.startsWith('/dashboard/examsection')) return 'Exam Section Dashboard';
        return 'Dashboard';
    };

    const RoleIcon = getRoleIcon(role);

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
                                <Link href={getDashboardPathForRole(role)} className="flex items-center space-x-3">
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
                                    {group.items.map((navItem) => {
                                        const Icon = navItem.icon;
                                        const isActive = pathname === navItem.href;

                                        return (
                                            <li key={navItem.href}>
                                                <Link
                                                    href={navItem.href}
                                                    className={cn(
                                                        'flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm relative',
                                                        isActive
                                                            ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/20'
                                                            : navItem.highlight
                                                            ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300 font-medium'
                                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        'w-4 h-4 transition-colors flex-shrink-0',
                                                        isActive
                                                            ? 'text-slate-900'
                                                            : navItem.highlight
                                                            ? 'text-amber-400'
                                                            : 'group-hover:text-amber-400',
                                                        sidebarOpen ? '' : 'mx-auto'
                                                    )} />
                                                    {sidebarOpen && (
                                                        <span className="flex-1 truncate">{navItem.label}</span>
                                                    )}
                                                    {sidebarOpen && navItem.badge && !isActive && (
                                                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                            {navItem.badge}
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

                    {/* User Profile (Bottom Sidebar) */}
                    <div className="p-4 border-t border-slate-800 space-y-2">
                        <div className={cn("flex items-center", sidebarOpen ? "justify-between" : "justify-center")}>
                            {sidebarOpen && (
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 shrink-0">
                                        <RoleIcon className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div className="text-sm truncate">
                                        <p className="font-medium text-white truncate max-w-[120px]">
                                            {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Faculty'}
                                        </p>
                                        <div className="flex items-center space-x-1 mt-0.5">
                                            <Badge className={cn("text-[9px] px-1.5 py-0 font-bold uppercase", getRoleAccentColor(role))}>
                                                {role === 'ExamSection' ? 'Exam Section' : role}
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
                            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">{getPageTitle()}</h1>
                        </div>

                        <div className="flex items-center space-x-2 sm:space-x-3">
                            {/* Role Indicator */}
                            <div className={cn(
                                "border rounded-xl px-2 sm:px-3 py-1 flex items-center space-x-1.5 text-xs",
                                role === 'HOD' ? "bg-amber-500/10 border-amber-500/30 text-amber-300" :
                                role === 'ExamSection' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" :
                                role === 'Admin' ? "bg-purple-500/10 border-purple-500/30 text-purple-300" :
                                "bg-slate-800 border-slate-700 text-slate-300"
                            )}>
                                <RoleIcon className="w-3.5 h-3.5" />
                                <span className="font-semibold hidden sm:inline">
                                    {role === 'ExamSection' ? 'Exam Section' : role}
                                </span>
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
