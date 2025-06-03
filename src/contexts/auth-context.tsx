
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
import { auth, storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME } from '@/lib/constants';

interface UserProfileUpdate {
  displayName?: string;
  photoURL?: string;
}

export interface OtherProfileData {
  role?: string;
  otherRole?: string;
  bio?: string;
  website?: string;
  firestoreUpdatedAt?: Timestamp;
}

const initialOtherProfileData: Omit<OtherProfileData, 'firestoreUpdatedAt'> = {
  role: "",
  otherRole: "",
  bio: "",
  website: "",
};

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  otherProfileData: OtherProfileData | null;
  otherProfileDataLoading: boolean;
  error: AuthError | null;
  signUp: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
  updateUserPhotoURL: (photoFile: File) => Promise<string | null>;
  saveOtherProfileData: (data: Omit<OtherProfileData, 'firestoreUpdatedAt'>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUserEmailWithVerification: (currentPassword: string, newEmail: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  const [otherProfileData, setOtherProfileData] = useState<OtherProfileData | null>(null);
  const [otherProfileDataLoading, setOtherProfileDataLoading] = useState(true);


  const fetchOtherProfileData = useCallback(async (userId: string) => {
    if (!userId) {
      console.warn("[AuthContext] fetchOtherProfileData called with no userId.");
      setOtherProfileDataLoading(false);
      return;
    }
    console.log(`[AuthContext] Attempting to fetch profile data for user: ${userId}`);
    setOtherProfileDataLoading(true);
    try {
      const profileDocRef = doc(db, "profiles", userId);
      const docSnap = await getDoc(profileDocRef);
      if (docSnap.exists()) {
        setOtherProfileData(docSnap.data() as OtherProfileData);
        console.log(`[AuthContext] Successfully fetched profile data for user: ${userId}`);
      } else {
        setOtherProfileData(initialOtherProfileData);
        console.log(`[AuthContext] No profile data found for user: ${userId}, initialized with defaults.`);
      }
    } catch (err) {
      console.error(`[AuthContext] Firestore error in fetchOtherProfileData for user ${userId}:`, err);
      setOtherProfileData(initialOtherProfileData);
      toast({ title: "Profile Data Error", description: "Could not load additional profile details.", variant: "destructive" });
    } finally {
      setOtherProfileDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser ? { ...firebaseUser } as FirebaseUser : null);
      setInitialLoading(false);
      if (firebaseUser) {
        await fetchOtherProfileData(firebaseUser.uid);
      } else {
        setOtherProfileData(null);
        setOtherProfileDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchOtherProfileData]);

  const signUp = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setError(null);
    console.log(`[AuthContext] Attempting to sign up user: ${email}`);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user ? { ...userCredential.user } as FirebaseUser : null;
      setUser(newUser);
      if (newUser) {
        console.log(`[AuthContext] User ${newUser.uid} signed up. Attempting to create profile document.`);
        await setDoc(doc(db, "profiles", newUser.uid), {
            ...initialOtherProfileData,
            firestoreUpdatedAt: serverTimestamp()
        });
        console.log(`[AuthContext] Profile document created for ${newUser.uid}.`);
        await fetchOtherProfileData(newUser.uid);
      }
      toast({ title: "Account Created!", description: `Welcome to ${APP_NAME}! You're all set.` });
      return newUser;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Sign up error for ${email}:`, authError);
      let message = authError.message || "Failed to create account. Please try again.";
      if (authError.code === 'auth/email-already-in-use') {
        message = `This email is already registered. Try signing in, or use a different email.`;
      } else if (authError.code === 'auth/weak-password') {
        message = "The password is too weak. Please choose a stronger password (at least 6 characters)."
      }
      toast({ title: "Sign Up Error", description: message, variant: "destructive" });
      return null;
    }
  }, [toast, fetchOtherProfileData]);

  const signIn = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    setError(null);
    console.log(`[AuthContext] Attempting to sign in user: ${email}`);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const signedInUser = userCredential.user ? { ...userCredential.user } as FirebaseUser : null;
      setUser(signedInUser);
      if (signedInUser) {
        console.log(`[AuthContext] User ${signedInUser.uid} signed in.`);
        await fetchOtherProfileData(signedInUser.uid);
      }
      toast({ title: "Signed In Successfully", description: `Welcome back to ${APP_NAME}!` });
      return signedInUser;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Sign in error for ${email}:`, authError);
      let message = authError.message || "Failed to sign in. Please check your credentials.";
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        message = "Incorrect email or password. Please check your details or sign up if you're new.";
      }
      toast({ title: "Sign In Error", description: message, variant: "destructive" });
      return null;
    }
  }, [toast, fetchOtherProfileData]);

  const signOut = useCallback(async () => {
    setError(null);
    console.log(`[AuthContext] Attempting to sign out user: ${user?.uid || 'No user'}`);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setOtherProfileData(null);
      console.log(`[AuthContext] User signed out successfully.`);
      toast({ title: "Signed Out", description: "You have successfully signed out. Come back soon!" });
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Sign out error:`, authError);
      toast({ title: "Sign Out Error", description: authError.message || "Failed to sign out.", variant: "destructive" });
    }
  }, [toast, user]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    console.log(`[AuthContext] Attempting to send password reset for email: ${email}`);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log(`[AuthContext] Password reset email sent to: ${email}`);
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a reset link has been sent. Check your inbox (and spam folder!)." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Password reset error for ${email}:`, authError);
      toast({ title: "Password Reset Request", description: "If an account exists for this email, a reset link has been sent. If you don't receive it, please check your email address and try again.", variant: authError.code === 'auth/user-not-found' ? "default" : "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    setError(null);
    console.log(`[AuthContext] Attempting to update Firebase Auth profile for user: ${auth.currentUser.uid} with data:`, profileData);
    try {
      await firebaseUpdateProfile(auth.currentUser, profileData);
      setUser(auth.currentUser ? { ...auth.currentUser } as FirebaseUser : null);
      console.log(`[AuthContext] Firebase Auth profile updated successfully for user: ${auth.currentUser.uid}`);
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Firebase Auth profile update error for user ${auth.currentUser.uid}:`, authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update display name/photo.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserPhotoURL = useCallback(async (photoFile: File): Promise<string | null> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile picture.", variant: "destructive" });
      return null;
    }
    setError(null);
    const userId = auth.currentUser.uid;
    console.log(`[AuthContext] Attempting to upload photo for user: ${userId}`);
    try {
      const filePath = `profile-pictures/${userId}/${Date.now()}_${photoFile.name}`;
      const fileRef = storageRef(storage, filePath);
      await uploadBytes(fileRef, photoFile);
      const photoURL = await getDownloadURL(fileRef);
      console.log(`[AuthContext] Photo uploaded to ${photoURL}. Updating Firebase Auth profile for user: ${userId}`);

      await firebaseUpdateProfile(auth.currentUser, { photoURL });
      setUser(auth.currentUser ? { ...auth.currentUser } as FirebaseUser : null);
      console.log(`[AuthContext] Firebase Auth profile photoURL updated for user: ${userId}`);
      return photoURL;
    } catch (e) {
      const err = e as AuthError | Error;
      console.error(`[AuthContext] Photo update error for user ${userId}:`, e);
      const firebaseError = err as AuthError;
      setError(firebaseError);
      let description = firebaseError.message || "Failed to update profile picture.";
      if (firebaseError.code === 'storage/unauthorized' ) {
          description = "Photo upload failed. Please check storage permissions for profile-pictures/{userId}/{fileName} or try again.";
      }
      toast({ title: "Photo Update Error", description, variant: "destructive" });
      return null;
    }
  }, [toast]);


  const saveOtherProfileData = useCallback(async (data: Omit<OtherProfileData, 'firestoreUpdatedAt'>): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to save profile details.", variant: "destructive" });
      return false;
    }
    setError(null);
    const userId = auth.currentUser.uid;
    console.log(`[AuthContext] Attempting to save other profile data for user: ${userId} with data:`, data);
    try {
      const profileDocRef = doc(db, "profiles", userId);
      const dataToSave = { ...data, firestoreUpdatedAt: serverTimestamp() };
      await setDoc(profileDocRef, dataToSave, { merge: true });
      console.log(`[AuthContext] Other profile data saved for user: ${userId}. Fetching updated data.`);
      await fetchOtherProfileData(userId);
      return true;
    } catch (e) {
      const err = e as Error;
      console.error(`[AuthContext] Firestore error in saveOtherProfileData for user ${userId}:`, err);
      toast({ title: "Profile Save Error", description: err.message || "Failed to save additional profile details.", variant: "destructive" });
      return false;
    }
  }, [toast, fetchOtherProfileData]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your password.", variant: "destructive" });
      return false;
    }
    setError(null);
    const userEmail = auth.currentUser.email;
    const userId = auth.currentUser.uid;
    console.log(`[AuthContext] Attempting to change password for user: ${userId} (${userEmail})`);
    try {
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log(`[AuthContext] User ${userId} reauthenticated. Updating password.`);
      await firebaseUpdatePassword(auth.currentUser, newPassword);
      console.log(`[AuthContext] Password changed successfully for user: ${userId}`);
      toast({ title: "Password Changed Successfully", description: "Your password has been updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Password change error for user ${userId}:`, authError);
      let errorMessage = authError.message || "Failed to change password.";
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        errorMessage = "Incorrect current password. Please try again.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "The new password is too weak. Please choose a stronger one (at least 6 characters).";
      }
      toast({ title: "Password Change Error", description: errorMessage, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserEmailWithVerification = useCallback(async (currentPassword: string, newEmail: string): Promise<boolean> => {
    if (!auth.currentUser || !auth.currentUser.email) {
      toast({ title: "Not Authenticated", description: "You must be logged in to change your email.", variant: "destructive" });
      return false;
    }
    setError(null);
    const oldEmail = auth.currentUser.email;
    const userId = auth.currentUser.uid;
    console.log(`[AuthContext] Attempting to update email for user: ${userId} from ${oldEmail} to ${newEmail}`);
    try {
      const credential = EmailAuthProvider.credential(oldEmail, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      console.log(`[AuthContext] User ${userId} reauthenticated. Sending verification email to ${newEmail}.`);
      await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
      console.log(`[AuthContext] Verification email sent to ${newEmail} for user ${userId}.`);
      toast({
        title: "Verification Email Sent",
        description: `A verification email has been sent to ${newEmail}. Please check your inbox and follow the instructions to complete the email change. Your current email remains active until then.`,
        duration: 9000,
      });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      setError(authError);
      console.error(`[AuthContext] Email update error for user ${userId}:`, authError);
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
    }
  }, [toast]);

  const value = {
    user,
    loading: initialLoading,
    otherProfileData,
    otherProfileDataLoading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserPhotoURL,
    saveOtherProfileData,
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

    