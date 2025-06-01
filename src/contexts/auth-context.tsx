
"use client";

import type { User as FirebaseUser, AuthError } from 'firebase/auth';
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  type ReactNode,
  useCallback
} from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: AuthError | null;
  signUp: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      toast({ title: "Account Created", description: "Welcome! You have successfully signed up." });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign Up Error", description: authError.message || "Failed to create account.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      toast({ title: "Signed In", description: "Welcome back!" });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign In Error", description: authError.message || "Failed to sign in.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      toast({ title: "Signed Out", description: "You have successfully signed out." });
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign Out Error", description: authError.message || "Failed to sign out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const value = { user, loading, error, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
