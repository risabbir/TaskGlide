
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
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { auth, storage } from '@/lib/firebase'; // Import storage
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage functions
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
  updateUserPhotoURL: (photoFile: File) => Promise<boolean>; // New function for photo
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false); // Renamed from 'loading' in context value
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // This is for initial auth state loading
    });
    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setGlobalLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user); // Update local state
      toast({ title: "Account Created", description: "Welcome! You have successfully signed up." });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign Up Error", description: authError.message || "Failed to create account.", variant: "destructive" });
      return null;
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setGlobalLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user); // Update local state
      toast({ title: "Signed In", description: "Welcome back!" });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign In Error", description: authError.message || "Failed to sign in.", variant: "destructive" });
      return null;
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setGlobalLoading(true);
    setError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null); // Update local state
      toast({ title: "Signed Out", description: "You have successfully signed out." });
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign Out Error", description: authError.message || "Failed to sign out.", variant: "destructive" });
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setGlobalLoading(true);
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
      setGlobalLoading(false);
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    setGlobalLoading(true);
    setError(null);
    try {
      await firebaseUpdateProfile(auth.currentUser, profileData);
      // Firebase onAuthStateChanged will eventually update the user object,
      // but we can also update it locally for immediate feedback if needed.
      // For displayName, it's usually quick. For photoURL, it might take a moment for cache to update.
      setUser(auth.currentUser); 
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update profile.", variant: "destructive" });
      return false;
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const updateUserPhotoURL = useCallback(async (photoFile: File): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile picture.", variant: "destructive" });
      return false;
    }
    setGlobalLoading(true);
    setError(null);
    try {
      const filePath = `profile-pictures/${auth.currentUser.uid}/${photoFile.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, photoFile);
      const photoURL = await getDownloadURL(fileRef);

      await firebaseUpdateProfile(auth.currentUser, { photoURL });
      // Update user state locally for immediate reflection
      // The onAuthStateChanged listener might also pick this up, but this is faster for UI.
      if (auth.currentUser) { // Check again as it might have changed (unlikely but good practice)
         setUser(prevUser => prevUser ? ({ ...prevUser, photoURL } as FirebaseUser) : null);
      }

      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
      return true;
    } catch (e) {
      const authError = e as AuthError; // Could be Storage error too
      console.error("Photo Update Error:", e);
      setError(authError);
      toast({ title: "Photo Update Error", description: authError.message || "Failed to update profile picture.", variant: "destructive" });
      return false;
    } finally {
      setGlobalLoading(false);
    }
  }, [toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your password.", variant: "destructive" });
      return false;
    }
    setGlobalLoading(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
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
      setGlobalLoading(false);
    }
  }, [toast]);

  // Use 'globalLoading' for the context's loading state to avoid conflict with 'loading' from useEffect
  const value = { user, loading: globalLoading || loading, error, signUp, signIn, signOut, resetPassword, updateUserProfile, updateUserPhotoURL, changePassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
