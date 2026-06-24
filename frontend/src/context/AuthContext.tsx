'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setAuthToken } from '@/services/api';

interface AppUser {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
  fullName: string | null;
  customUserId: string | null;
  token: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<{ redirectPath: string }>;
  register: (email: string, password: string, fullName: string, organizationId: string, role: string) => Promise<{ redirectPath: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

let isManualAuthInProgress = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        if (isManualAuthInProgress) {
          // Skip the backend sync here, because login() or register() handles it
          return;
        }
        try {
          const token = await fbUser.getIdToken(true);
          // Sync with backend
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setAuthToken(token);
              setUser({
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                organizationId: data.user.organizationId || null,
                fullName: data.user.fullName || null,
                customUserId: data.user.customUserId || null,
                token,
              });
              setCookie('__session', '1', 7);
            } else {
              setAuthToken(null);
              setUser(null);
              deleteCookie('__session');
            }
          } else {
            setAuthToken(null);
            setUser(null);
            deleteCookie('__session');
          }
        } catch {
          setAuthToken(null);
          setUser(null);
          deleteCookie('__session');
        }
      } else {
        setAuthToken(null);
        setUser(null);
        deleteCookie('__session');
      }
      setLoading(false);
      setInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    isManualAuthInProgress = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }
      setAuthToken(token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        organizationId: data.user.organizationId || null,
        fullName: data.user.fullName || null,
        customUserId: data.user.customUserId || null,
        token,
      });
      setCookie('__session', '1', 7);
      
      // Ensure state is updated before returning
      setFirebaseUser(cred.user);
      setInitialized(true);
      return { redirectPath: data.redirectPath };
    } finally {
      isManualAuthInProgress = false;
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, organizationId: string, role: string) => {
    setLoading(true);
    isManualAuthInProgress = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken(true);
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, organizationId, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }
      setAuthToken(token);
      setUser({
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        organizationId: data.user.organizationId || null,
        fullName: fullName,
        customUserId: data.user.customUserId || null,
        token,
      });
      setCookie('__session', '1', 7);
      
      setFirebaseUser(cred.user);
      setInitialized(true);
      return { redirectPath: data.redirectPath };
    } finally {
      isManualAuthInProgress = false;
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    isManualAuthInProgress = true;
    try {
      await firebaseSignOut(auth);
      setAuthToken(null);
      setUser(null);
      setFirebaseUser(null);
      deleteCookie('__session');
    } finally {
      isManualAuthInProgress = false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, initialized, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
