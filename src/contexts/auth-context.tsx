
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
import { APP_NAME } from '@/lib/constants';

interface UserProfileUpdate {
  displayName?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean; 
  authOpLoading: boolean; 
  error: AuthError | null;
  signUp: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
  updateUserPhotoURL: (photoFile: File) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authOpLoading, setAuthOpLoading] = useState(false); 
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? { ...firebaseUser } as FirebaseUser : null); // Ensure new object for re-renders
      setInitialLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setAuthOpLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user ? { ...userCredential.user } as FirebaseUser : null); 
      toast({ title: "Account Created", description: `Welcome to ${APP_NAME}! You have successfully signed up.` });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign Up Error", description: authError.message || "Failed to create account.", variant: "destructive" });
      return null;
    } finally {
      setAuthOpLoading(false);
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setAuthOpLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user ? { ...userCredential.user } as FirebaseUser : null); 
      toast({ title: "Signed In", description: "Welcome back!" });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Sign In Error", description: authError.message || "Failed to sign in.", variant: "destructive" });
      return null;
    } finally {
      setAuthOpLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setAuthOpLoading(true);
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
      setAuthOpLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setAuthOpLoading(true);
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
      setAuthOpLoading(false);
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    setError(null);
    try {
      await firebaseUpdateProfile(auth.currentUser, profileData);
      // Ensure user state is updated with a new object reference
      const latestUser = auth.currentUser;
      setUser(latestUser ? { ...latestUser } as FirebaseUser : null);
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update profile.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserPhotoURL = useCallback(async (photoFile: File): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile picture.", variant: "destructive" });
      return false;
    }
    setError(null);
    try {
      const filePath = `profile-pictures/${auth.currentUser.uid}/${photoFile.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, photoFile);
      const photoURL = await getDownloadURL(fileRef);

      await firebaseUpdateProfile(auth.currentUser, { photoURL });
      // Ensure user state is updated with a new object reference
      const latestUser = auth.currentUser;
      setUser(latestUser ? { ...latestUser } as FirebaseUser : null);

      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
      return true;
    } catch (e) {
      const err = e as AuthError | Error; 
      console.error("Photo Update Error:", e);
      setError(err as AuthError); 
      toast({ title: "Photo Update Error", description: err.message || "Failed to update profile picture.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your password.", variant: "destructive" });
      return false;
    }
    setAuthOpLoading(true);
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
      setAuthOpLoading(false);
    }
  }, [toast]);

  const value = { 
    user, 
    loading: initialLoading,
    authOpLoading, 
    error, 
    signUp, 
    signIn, 
    signOut, 
    resetPassword, 
    updateUserProfile, 
    updateUserPhotoURL, 
    changePassword 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
