'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (nickname: string) => {
    try {
      // 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${nickname}@murmur.local`,
        password: 'murmur1234',
      });

      if (error) {
        // 계정이 없는 경우 회원가입
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: `${nickname}@murmur.local`,
          password: 'murmur1234',
        });

        if (signUpError) throw signUpError;

        // 회원가입 후 바로 로그인
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: `${nickname}@murmur.local`,
          password: 'murmur1234',
        });

        if (signInError) throw signInError;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 