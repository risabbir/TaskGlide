
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
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  EmailAuthProvider, // Added for re-authentication
  reauthenticateWithCredential, // Added for re-authentication
  updatePassword as firebaseUpdatePassword // Added for password change
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface UserProfileUpdate {
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: AuthError | null;
  signUp: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>; // Added
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

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password Reset Email Sent", description: "Check your inbox for instructions to reset your password." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Password Reset Error", description: authError.message || "Failed to send password reset email.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      await firebaseUpdateProfile(auth.currentUser, profileData);
      setUser(auth.currentUser); 
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update profile.", variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your password.", variant: "destructive" });
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // User re-authenticated, now change password
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      let errorMessage = authError.message || "Failed to change password.";
      if (authError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak. Please choose a stronger password.";
      }
      toast({ title: "Password Change Error", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);


  const value = { user, loading, error, signUp, signIn, signOut, resetPassword, updateUserProfile, changePassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
