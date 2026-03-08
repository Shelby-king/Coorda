'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createOrGetUser, getUser } from '@/lib/api/users';
import type { User } from '@/types';

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'host' | 'developer', displayName?: string) => Promise<void>;
  signInWithGoogle: (role?: 'host' | 'developer') => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async (fbUser: FirebaseUser) => {
    try {
      const profile = await getUser(fbUser.uid);
      setUser(profile);
    } catch {
      // Profile might not exist yet — that's okay
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await loadUserProfile(fbUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await loadUserProfile(cred.user);
  };

  const signUp = async (
    email: string,
    password: string,
    role: 'host' | 'developer',
    displayName?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const profile = await createOrGetUser({ email, role, displayName });
    setUser(profile);
    setFirebaseUser(cred.user);
  };

  const signInWithGoogle = async (role: 'host' | 'developer' = 'developer') => {
    const cred = await signInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    // Ensure profile exists in our backend
    const profile = await createOrGetUser({
      email: fbUser.email!,
      role,
      displayName: fbUser.displayName || undefined,
    });
    setUser(profile);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = useCallback(async () => {
    if (firebaseUser) await loadUserProfile(firebaseUser);
  }, [firebaseUser, loadUserProfile]);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, signIn, signUp, signInWithGoogle, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
