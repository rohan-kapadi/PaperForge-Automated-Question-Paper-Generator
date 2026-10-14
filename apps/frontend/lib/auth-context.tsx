'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'Admin' | 'HOD' | 'Teacher' | 'Auditor';

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
    isLoading: boolean;
    roleOverride: UserRole | null;
    setRoleOverride: (role: UserRole | null) => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: null,
    role: 'Teacher',
    isHODOrAdmin: false,
    isLoading: true,
    roleOverride: null,
    setRoleOverride: () => {},
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [roleOverride, setRoleOverrideState] = useState<UserRole | null>(null);

    // Load dev role override from localStorage if set
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('paperforge_dev_role_override') as UserRole | null;
            if (saved && ['Admin', 'HOD', 'Teacher', 'Auditor'].includes(saved)) {
                setRoleOverrideState(saved);
            }
        }
    }, []);

    const setRoleOverride = (newRole: UserRole | null) => {
        setRoleOverrideState(newRole);
        if (typeof window !== 'undefined') {
            if (newRole) {
                localStorage.setItem('paperforge_dev_role_override', newRole);
            } else {
                localStorage.removeItem('paperforge_dev_role_override');
            }
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadSessionAndProfile = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!isMounted) return;

                setSession(currentSession);
                setUser(currentSession?.user || null);

                if (currentSession?.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentSession.user.id)
                        .maybeSingle();

                    if (isMounted) {
                        if (profileData) {
                            setProfile(profileData as UserProfile);
                        } else {
                            // Fallback default profile
                            setProfile({
                                id: currentSession.user.id,
                                email: currentSession.user.email || '',
                                full_name: currentSession.user.user_metadata?.full_name || 'Faculty Member',
                                role: 'Teacher',
                            });
                        }
                    }
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.warn('Error loading auth profile:', err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
            setUser(newSession?.user || null);

            if (newSession?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newSession.user.id)
                    .maybeSingle();

                if (isMounted && profileData) {
                    setProfile(profileData as UserProfile);
                }
            } else {
                setProfile(null);
            }
            setIsLoading(false);
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

    // If role override is set (e.g. testing HOD vs Teacher in UI), use it.
    // Otherwise fallback to profile role, or default to 'Teacher'.
    const effectiveRole: UserRole = roleOverride || profile?.role || 'Teacher';
    const isHODOrAdmin = effectiveRole === 'HOD' || effectiveRole === 'Admin';

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                profile,
                role: effectiveRole,
                isHODOrAdmin,
                isLoading,
                roleOverride,
                setRoleOverride,
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
