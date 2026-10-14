'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'Admin' | 'HOD' | 'Teacher' | 'ExamSection' | 'Auditor';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    department_id?: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: UserProfile | null;
    role: UserRole;
    isHODOrAdmin: boolean;
    isExamSection: boolean;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HARDCODED ROLE CONFIGURATION
// Update these arrays to add/remove emails for each role.
// Teachers are everyone else (any email not in the lists below).
// ─────────────────────────────────────────────────────────────────────────────
export const HOD_EMAILS: string[] = [
    'hod@pccoer.edu',
    // Add more HOD emails here, e.g.:
    // 'department.hod@pccoer.edu',
];

export const EXAM_SECTION_EMAILS: string[] = [
    'examsection@pccoer.edu',
    // Add more exam section emails here, e.g.:
    // 'exams@pccoer.edu',
];

export const ADMIN_EMAILS: string[] = [
    // Add admin emails here
];

/**
 * Derives a role from the user's email address using the hardcoded lists above.
 * Returns null if the email doesn't match any special role (defaults to Teacher).
 */
export function getRoleFromEmail(email: string): UserRole | null {
    const normalized = email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(normalized)) return 'Admin';
    if (HOD_EMAILS.includes(normalized)) return 'HOD';
    if (EXAM_SECTION_EMAILS.includes(normalized)) return 'ExamSection';
    return null;
}

/**
 * Returns the default redirect path for a given role after login.
 */
export function getDashboardPathForRole(role: UserRole): string {
    if (role === 'HOD' || role === 'Admin') return '/dashboard/hod';
    if (role === 'ExamSection') return '/dashboard/examsection';
    return '/dashboard';
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    role: 'Teacher',
    isHODOrAdmin: false,
    isExamSection: false,
    isLoading: true,
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = async (authUser: User) => {
        const emailRole = getRoleFromEmail(authUser.email || '');

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

        if (profileData) {
            setProfile({
                ...profileData,
                role: emailRole ?? (profileData.role as UserRole) ?? 'Teacher',
            } as UserProfile);
        } else {
            setProfile({
                id: authUser.id,
                email: authUser.email || '',
                full_name: authUser.user_metadata?.full_name || 'Faculty Member',
                role: emailRole ?? 'Teacher',
            });
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!isMounted) return;

                setSession(currentSession);
                setUser(currentSession?.user || null);

                if (currentSession?.user) {
                    await loadProfile(currentSession.user);
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.warn('Error loading auth profile:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
            setUser(newSession?.user || null);

            if (newSession?.user) {
                await loadProfile(newSession.user);
            } else {
                setProfile(null);
            }
            if (isMounted) setIsLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const effectiveRole: UserRole = profile?.role ?? 'Teacher';
    const isHODOrAdmin = effectiveRole === 'HOD' || effectiveRole === 'Admin';
    const isExamSection = effectiveRole === 'ExamSection';

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                role: effectiveRole,
                isHODOrAdmin,
                isExamSection,
                isLoading,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
