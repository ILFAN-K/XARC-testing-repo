'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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

/**
 * Set a cookie with consistent attributes.
 * Both setCookie and deleteCookie must use identical path + SameSite
 * attributes, otherwise browsers (especially Edge) may treat them
 * as different cookies and fail to delete/overwrite correctly.
 */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

/**
 * Verify the cookie was actually written by reading it back.
 * Edge sometimes needs a microtask tick for document.cookie writes
 * to be visible to subsequent reads.
 */
function waitForCookie(name: string, maxWaitMs = 100): Promise<boolean> {
  return new Promise((resolve) => {
    // Fast path: cookie is already visible
    if (document.cookie.includes(`${name}=`)) {
      resolve(true);
      return;
    }
    // Slow path: wait for the cookie to appear
    const start = Date.now();
    const check = () => {
      if (document.cookie.includes(`${name}=`)) {
        resolve(true);
      } else if (Date.now() - start > maxWaitMs) {
        resolve(false);
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Track whether login()/register() is currently handling auth.
  // Uses a ref instead of module-scoped variable to avoid stale state
  // persisting across Next.js soft navigations.
  const manualAuthRef = useRef(false);

  // Track if this provider instance has already been initialized.
  const hasResolvedRef = useRef(false);

  // Listen to Firebase auth state
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!isMounted) return;

      setFirebaseUser(fbUser);

      if (fbUser) {
        if (manualAuthRef.current) {
          // login()/register() is handling auth — skip backend sync here.
          // The manual auth flow sets loading/initialized in its own
          // finally block, so we must NOT call setLoading/setInitialized
          // here (they'd race with the manual flow's state updates).
          return;
        }

        try {
          const token = await fbUser.getIdToken(true);
          if (!isMounted) return;

          // Sync with backend
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!isMounted) return;

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
          if (!isMounted) return;
          setAuthToken(null);
          setUser(null);
          deleteCookie('__session');
        }
      } else {
        setAuthToken(null);
        setUser(null);
        deleteCookie('__session');
      }

      if (isMounted) {
        hasResolvedRef.current = true;
        setLoading(false);
        setInitialized(true);
      }
    });

    // Safety timeout: if onAuthStateChanged hasn't resolved within 5 seconds,
    // force the state to resolve to prevent infinite spinner.
    const safetyTimer = setTimeout(() => {
      if (isMounted && !hasResolvedRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    manualAuthRef.current = true;
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

      // CRITICAL FIX: Wait for the cookie to be committed before navigation.
      // Edge's document.cookie writes are asynchronous — if we navigate
      // immediately, the Next.js middleware may not see the cookie on the
      // next server request, causing a redirect to /login → /  loop.
      await waitForCookie('__session');

      // Ensure state is updated before returning
      setFirebaseUser(cred.user);
      hasResolvedRef.current = true;
      setInitialized(true);
      return { redirectPath: data.redirectPath };
    } finally {
      manualAuthRef.current = false;
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, organizationId: string, role: string) => {
    setLoading(true);
    manualAuthRef.current = true;
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

      // Wait for cookie to be committed before navigation
      await waitForCookie('__session');

      setFirebaseUser(cred.user);
      hasResolvedRef.current = true;
      setInitialized(true);
      return { redirectPath: data.redirectPath };
    } finally {
      manualAuthRef.current = false;
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    manualAuthRef.current = true;
    try {
      await firebaseSignOut(auth);
      setAuthToken(null);
      setUser(null);
      setFirebaseUser(null);
      deleteCookie('__session');
    } finally {
      manualAuthRef.current = false;
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
