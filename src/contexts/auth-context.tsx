
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
  updatePassword as firebaseUpdatePassword,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { auth, storage } from '@/lib/firebase'; 
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; 
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
  updateUserEmailWithVerification: (currentPassword: string, newEmail: string) => Promise<boolean>;
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
      setUser(firebaseUser ? { ...firebaseUser } as FirebaseUser : null); 
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
      toast({ title: "Account Created!", description: `Welcome to ${APP_NAME}! You're all set.` });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      let message = authError.message || "Failed to create account. Please try again.";
      if (authError.code === 'auth/email-already-in-use') {
        message = `This email is already registered. Try signing in, or use a different email.`;
      } else if (authError.code === 'auth/weak-password') {
        message = "The password is too weak. Please choose a stronger password (at least 6 characters)."
      }
      toast({ title: "Sign Up Error", description: message, variant: "destructive" });
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
      toast({ title: "Signed In Successfully", description: `Welcome back to ${APP_NAME}!` });
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      let message = authError.message || "Failed to sign in. Please check your credentials.";
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        message = "Incorrect email or password. Please check your details or sign up if you're new.";
      }
      toast({ title: "Sign In Error", description: message, variant: "destructive" });
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
      toast({ title: "Signed Out", description: "You have successfully signed out. Come back soon!" });
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
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a reset link has been sent. Check your inbox (and spam folder!)." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      // Simplified message to avoid giving away whether an account exists for privacy reasons
      toast({ title: "Password Reset Request", description: "If an account exists for this email, a reset link has been sent. If you don't receive it, please check your email address and try again.", variant: authError.code === 'auth/user-not-found' ? "default" : "destructive" });
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
    setAuthOpLoading(true);
    setError(null);
    try {
      await firebaseUpdateProfile(auth.currentUser, profileData);
      setUser(auth.currentUser ? { ...auth.currentUser } as FirebaseUser : null);
      // Toast for display name update is usually handled by the caller form with more context
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update profile.", variant: "destructive" });
      return false;
    } finally {
      setAuthOpLoading(false);
    }
  }, [toast, setUser]);

  const updateUserPhotoURL = useCallback(async (photoFile: File): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile picture.", variant: "destructive" });
      return false;
    }
    setAuthOpLoading(true);
    setError(null);
    try {
      const filePath = `profile-pictures/${auth.currentUser.uid}/${Date.now()}_${photoFile.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, photoFile);
      const photoURL = await getDownloadURL(fileRef);

      await firebaseUpdateProfile(auth.currentUser, { photoURL });
      setUser(auth.currentUser ? { ...auth.currentUser } as FirebaseUser : null); 

      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been saved." });
      return true;
    } catch (e) {
      const err = e as AuthError | Error; 
      console.error("Photo Update Error:", e);
      // Check if error has a 'code' property to differentiate Firebase errors
      const firebaseError = err as AuthError;
      setError(firebaseError); 
      let description = firebaseError.message || "Failed to update profile picture.";
      if (firebaseError.code === 'storage/unauthorized' || firebaseError.code === 'storage/object-not-found') { // Example codes
          description = "Photo update failed. Please check storage permissions or try again.";
      }
      toast({ title: "Photo Update Error", description, variant: "destructive" });
      return false;
    } finally {
      setAuthOpLoading(false);
    }
  }, [toast, setUser]);

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
      toast({ title: "Password Changed Successfully", description: "Your password has been updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      let errorMessage = authError.message || "Failed to change password.";
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak. Please choose a stronger one (at least 6 characters).";
      }
      toast({ title: "Password Change Error", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setAuthOpLoading(false);
    }
  }, [toast]);

  const updateUserEmailWithVerification = useCallback(async (currentPassword: string, newEmail: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your email.", variant: "destructive" });
      return false;
    }
    setAuthOpLoading(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      toast({ 
        title: "Verification Email Sent", 
        description: `A verification email has been sent to ${newEmail}. Please check your inbox and follow the instructions to complete the email change. Your current email remains active until then.`,
        duration: 9000,
      });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      let errorMessage = authError.message || "Failed to initiate email change.";
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "The new email address is already in use by another account.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "The new email address is not valid.";
      }
      toast({ title: "Email Change Error", description: errorMessage, variant: "destructive" });
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
    changePassword,
    updateUserEmailWithVerification
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

    
