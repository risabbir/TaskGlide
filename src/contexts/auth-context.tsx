
"use client";

import type { User as FirebaseUser, AuthError, UserCredential } from 'firebase/auth';
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
  verifyBeforeUpdateEmail,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from 'firebase/auth';
import { auth, storage, db } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { APP_NAME, GUEST_ID_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation';

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
  guestId: string | null;
  isGuest: boolean;
  loading: boolean;
  otherProfileData: OtherProfileData | null;
  otherProfileDataLoading: boolean;
  signUp: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signIn: (email: string, pass: string) => Promise<FirebaseUser | null>;
  signInWithGoogle: () => Promise<FirebaseUser | null>;
  signOut: () => Promise<void>;
  startNewGuestSession: () => void;
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
  const [guestId, setGuestId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [otherProfileData, setOtherProfileData] = useState<OtherProfileData | null>(null);
  const [otherProfileDataLoading, setOtherProfileDataLoading] = useState(true);

  const isGuest = !!guestId && !user;

  const handleFirestorePermissionError = (operation: string, error: any, path: string) => {
    console.error(`[AuthContext] Firestore PERMISSION_DENIED during ${operation} for path "${path}":`, error.message, error.code, error);
    toast({
      title: `Profile Data Access Error (${operation})`,
      description: `Could not ${operation.toLowerCase()} profile data. This is likely due to Firestore security rules. Please ensure rules allow access to "${path}" for authenticated users. (Error: ${error.code || 'UNKNOWN'})`,
      variant: "destructive",
      duration: 10000,
    });
  };
  
  const ensureUserProfileDocument = useCallback(async (firebaseUser: FirebaseUser) => {
    const profileDocPath = `profiles/${firebaseUser.uid}`;
    console.log(`[AuthContext] ensureUserProfileDocument: Checking/creating profile for ${profileDocPath}.`);
    try {
      const profileDocRef = doc(db, "profiles", firebaseUser.uid);
      const docSnap = await getDoc(profileDocRef);
      if (!docSnap.exists()) {
        console.log(`[AuthContext] ensureUserProfileDocument: No profile found for ${firebaseUser.uid}. Creating initial profile document.`);
        await setDoc(profileDocRef, {
          ...initialOtherProfileData,
          firestoreUpdatedAt: serverTimestamp()
        });
        console.log(`[AuthContext] ensureUserProfileDocument: Initial profile document created for ${profileDocPath}.`);
        return initialOtherProfileData; 
      } else {
        console.log(`[AuthContext] ensureUserProfileDocument: Profile document already exists for ${profileDocPath}.`);
        return docSnap.data() as OtherProfileData; 
      }
    } catch (profileError: any) {
      if (profileError.code === 'permission-denied' || profileError.code === 7) {
        handleFirestorePermissionError('ensure/create profile', profileError, profileDocPath);
      } else {
        console.error(`[AuthContext] ensureUserProfileDocument: Firestore error for ${profileDocPath}:`, profileError.message, profileError.code, profileError);
        toast({ title: "Profile Sync Error", description: "Could not ensure user profile data exists.", variant: "destructive" });
      }
      return null; 
    }
  }, [toast]);


  const fetchOtherProfileData = useCallback(async (userIdToFetch: string) => {
    const currentSdkUser = auth.currentUser;
    if (!userIdToFetch || !currentSdkUser || currentSdkUser.uid !== userIdToFetch) {
      console.error(`[AuthContext] fetchOtherProfileData critical error: Invalid state for fetching. Context UserID: ${userIdToFetch}, SDK UserID: ${currentSdkUser?.uid}. Aborting fetch.`);
      setOtherProfileData(null);
      setOtherProfileDataLoading(false);
      if (userIdToFetch && !currentSdkUser) {
        toast({ title: "Profile Load Error", description: "Authentication state error (SDK user null). Could not load profile details.", variant: "destructive" });
      } else if (userIdToFetch && currentSdkUser && currentSdkUser.uid !== userIdToFetch) {
         toast({ title: "Profile Load Error", description: "Authentication state error (ID mismatch). Could not load profile details.", variant: "destructive" });
      }
      return;
    }
    const profileDocPath = `profiles/${userIdToFetch}`;
    console.log(`[AuthContext] Attempting to GET doc: ${profileDocPath} for user: ${userIdToFetch}`);
    setOtherProfileDataLoading(true);
    try {
      const profileDocRef = doc(db, "profiles", userIdToFetch);
      const docSnap = await getDoc(profileDocRef);
      if (docSnap.exists()) {
        setOtherProfileData(docSnap.data() as OtherProfileData);
        console.log(`[AuthContext] Successfully fetched profile data from ${profileDocPath} for user: ${userIdToFetch}`);
      } else {
        console.log(`[AuthContext] No profile data found at ${profileDocPath} for user: ${userIdToFetch}. Attempting to ensure profile document.`);
        const ensuredData = await ensureUserProfileDocument(currentSdkUser);
        setOtherProfileData(ensuredData || initialOtherProfileData);
      }
    } catch (err: any) {
      if (err.code === 'permission-denied' || err.code === 7) { 
        handleFirestorePermissionError('fetch', err, profileDocPath);
      } else {
        console.error(`[AuthContext] Firestore error in fetchOtherProfileData for ${profileDocPath} (User: ${userIdToFetch}):`, err.message, err.code, err);
        toast({ title: "Profile Data Error", description: `Could not load additional profile details. Error: ${err.message}`, variant: "destructive" });
      }
      setOtherProfileData(initialOtherProfileData); 
    } finally {
      setOtherProfileDataLoading(false);
    }
  }, [toast, ensureUserProfileDocument]);

  useEffect(() => {
    console.log("[AuthContext] Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(`[AuthContext] onAuthStateChanged: User signed IN. UID: ${firebaseUser.uid}. Clearing guest session.`);
        setUser({ ...firebaseUser } as FirebaseUser);
        setGuestId(null); 
        localStorage.removeItem(GUEST_ID_STORAGE_KEY); 
        await fetchOtherProfileData(firebaseUser.uid);
      } else {
        console.log("[AuthContext] onAuthStateChanged: User signed OUT or initial load without auth. Checking for existing guest session.");
        setUser(null);
        const storedGuestId = localStorage.getItem(GUEST_ID_STORAGE_KEY);
        if (storedGuestId) {
            console.log(`[AuthContext] Restored guest session ID: ${storedGuestId}`);
            setGuestId(storedGuestId);
        } else {
            setGuestId(null); 
        }
        setOtherProfileData(null); 
        setOtherProfileDataLoading(false);
      }
      setInitialLoading(false);
    });
    return () => {
      console.log("[AuthContext] Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, [fetchOtherProfileData]);

  const startNewGuestSession = useCallback(() => {
    console.log("[AuthContext] Starting new guest session.");
    const newGuestId = `guest-${crypto.randomUUID().substring(0, 8)}`;
    setGuestId(newGuestId);
    localStorage.setItem(GUEST_ID_STORAGE_KEY, newGuestId);
    setUser(null); 
    setOtherProfileData(null);
    setOtherProfileDataLoading(false);
    setInitialLoading(false); 
    console.log(`[AuthContext] New guest session started with ID: ${newGuestId}. Navigating to home.`);
    router.push('/');
  }, [router]);

  const signUp = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    console.log(`[AuthContext] Attempting to sign up user: ${email}`);
    setInitialLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user ? { ...userCredential.user } as FirebaseUser : null;
      if (newUser) {
        setGuestId(null); 
        localStorage.removeItem(GUEST_ID_STORAGE_KEY);
        await ensureUserProfileDocument(newUser); 
      }
      toast({ title: "Account Created!", description: `Welcome to ${APP_NAME}! You're all set.` });
      return newUser;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Sign up error for ${email}:`, authError.message, authError.code, authError);
      let message = `Failed to create account. Please try again. (Code: ${authError.code || 'unknown'})`;
      if (authError.code === 'auth/email-already-in-use') {
        message = `This email is already registered. Try signing in, or use a different email.`;
      } else if (authError.code === 'auth/weak-password') {
        message = "The password is too weak. Please choose a stronger password (at least 6 characters)."
      }
      toast({ title: "Sign Up Error", description: message, variant: "destructive" });
      return null;
    } finally {
        setInitialLoading(false);
    }
  }, [toast, ensureUserProfileDocument]);

  const signIn = useCallback(async (email: string, pass: string): Promise<FirebaseUser | null> => {
    console.log(`[AuthContext] Attempting to sign in user: ${email}`);
    setInitialLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const signedInUser = userCredential.user ? { ...userCredential.user } as FirebaseUser : null;
      if (signedInUser) {
        setGuestId(null); 
        localStorage.removeItem(GUEST_ID_STORAGE_KEY);
        await fetchOtherProfileData(signedInUser.uid); 
      }
      toast({ title: "Signed In Successfully", description: `Welcome back to ${APP_NAME}!` });
      return signedInUser;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Sign in error for ${email}:`, authError.message, authError.code, authError);
      let message = `Failed to sign in. Please check your credentials. (Code: ${authError.code || 'unknown'})`;
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        message = "Incorrect email or password. Please check your details or sign up if you're new.";
      }
      toast({ title: "Sign In Error", description: message, variant: "destructive" });
      return null;
    } finally {
        setInitialLoading(false);
    }
  }, [toast, fetchOtherProfileData]);

  const handleSocialSignIn = async (provider: GoogleAuthProvider): Promise<FirebaseUser | null> => {
    setInitialLoading(true);
    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      const socialUser = result.user ? { ...result.user } as FirebaseUser : null;

      if (socialUser) {
        setGuestId(null);
        localStorage.removeItem(GUEST_ID_STORAGE_KEY);
        
        const additionalUserInfo = getAdditionalUserInfo(result);
        if (additionalUserInfo?.isNewUser) {
          console.log(`[AuthContext] New user signed in with ${provider.providerId}. Ensuring profile document.`);
          await ensureUserProfileDocument(socialUser);
        } else {
          console.log(`[AuthContext] Existing user signed in with ${provider.providerId}. Fetching profile.`);
          await fetchOtherProfileData(socialUser.uid);
        }
        toast({ title: "Signed In Successfully!", description: `Welcome to ${APP_NAME}!` });
        router.push("/");
        return socialUser;
      }
      return null;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Social sign in error with ${provider.providerId}:`, authError.message, authError.code, authError);
      let message = `Failed to sign in with Google. Please try again.`;
      if (authError.code === 'auth/account-exists-with-different-credential') {
        message = `An account already exists with this email address using a different sign-in method. Try signing in with that method.`;
      } else if (authError.code === 'auth/popup-closed-by-user') {
        message = `Sign-in popup was closed before completion. Please try again.`;
      } else if (authError.code === 'auth/cancelled-popup-request') {
         message = `Multiple sign-in attempts detected. Please try again.`;
      }
      toast({ title: "Google Sign-In Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setInitialLoading(false);
    }
  };

  const signInWithGoogle = useCallback(async (): Promise<FirebaseUser | null> => {
    console.log("[AuthContext] Attempting Google sign-in.");
    const provider = new GoogleAuthProvider();
    return handleSocialSignIn(provider);
  }, [ensureUserProfileDocument, fetchOtherProfileData, toast, router]);


  const signOut = useCallback(async () => {
    const currentUid = auth.currentUser?.uid;
    console.log(`[AuthContext] Attempting to sign out user: ${currentUid || 'No user currently authenticated'}`);
    try {
      await firebaseSignOut(auth);
      console.log(`[AuthContext] User ${currentUid} signed out successfully (request initiated). Clearing guest session info.`);
      setGuestId(null); 
      localStorage.removeItem(GUEST_ID_STORAGE_KEY); 
      toast({ title: "Signed Out", description: "You have successfully signed out. Come back soon!" });
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Sign out error for user ${currentUid}:`, authError.message, authError.code, authError);
      toast({ title: "Sign Out Error", description: authError.message || "Failed to sign out.", variant: "destructive" });
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    console.log(`[AuthContext] Attempting to send password reset for email: ${email}`);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log(`[AuthContext] Password reset email sent to: ${email}`);
      toast({ title: "Password Reset Email Sent", description: "If an account exists for this email, a reset link has been sent. Check your inbox (and spam folder!)." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Password reset error for ${email}:`, authError.message, authError.code, authError);
      toast({ title: "Password Reset Request", description: `Could not send reset email. If the problem persists, check if the email address is correct. (Error: ${authError.code || 'unknown'})`, variant: "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData: UserProfileUpdate): Promise<boolean> => {
    const currentSdkUser = auth.currentUser;
     if (!currentSdkUser) {
      console.error("[AuthContext] updateUserProfile critical error: No authenticated user found via SDK check.");
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
      return false;
    }
    const userId = currentSdkUser.uid;
    console.log(`[AuthContext] Attempting to update Firebase Auth profile for user: ${userId} with data:`, profileData);
    try {
      await firebaseUpdateProfile(currentSdkUser, profileData);
      setUser(auth.currentUser ? { ...auth.currentUser } as FirebaseUser : null);
      console.log(`[AuthContext] Firebase Auth profile updated successfully for user: ${userId}`);
      return true;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Firebase Auth profile update error for user ${userId}:`, authError.message, authError.code, authError);
      toast({ title: "Profile Update Error", description: authError.message || "Failed to update display name/photo.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const updateUserPhotoURL = useCallback(async (photoFile: File): Promise<string | null> => {
    const currentSdkUser = auth.currentUser;
    if (!currentSdkUser) {
      console.error("[AuthContext] updateUserPhotoURL critical error: No authenticated user found via SDK check.");
      toast({ title: "Not Authenticated", description: "You must be logged in to update your profile picture.", variant: "destructive" });
      return null;
    }
    const userId = currentSdkUser.uid;
    console.log(`[AuthContext] Attempting to upload photo for user: ${userId}, filename: ${photoFile.name}`);
    try {
      const filePath = `profile-pictures/${userId}/${Date.now()}_${photoFile.name}`;
      const fileRef = storageRef(storage, filePath);
      console.log(`[AuthContext] Uploading to Firebase Storage path: ${filePath}`);
      await uploadBytes(fileRef, photoFile);
      const photoURL = await getDownloadURL(fileRef);
      console.log(`[AuthContext] Photo uploaded to ${photoURL}. Updating Firebase Auth profile for user: ${userId}`);

      const profileUpdateSuccess = await updateUserProfile({ photoURL });
      if (profileUpdateSuccess) {
        console.log(`[AuthContext] Firebase Auth profile photoURL updated for user: ${userId}.`);
        return photoURL;
      } else {
        console.error(`[AuthContext] Failed to update photoURL in Firebase Auth profile for user: ${userId} even after successful upload.`);
        toast({ title: "Photo Update Error", description: "Photo uploaded, but profile update failed.", variant: "destructive" });
        return null;
      }
    } catch (e: any) {
      console.error(`[AuthContext] Photo upload or profile update error for user ${userId}:`, e);
      const firebaseError = e as AuthError;
      let description = firebaseError.message || "Failed to update profile picture.";
      if (firebaseError.code === 'storage/unauthorized' ) {
          description = "Photo upload failed due to storage permissions. Ensure Firebase Storage rules allow writes to `profile-pictures/{userId}/{fileName}` for authenticated users.";
      } else if (firebaseError.code) {
          description = `Firebase Storage Error (${firebaseError.code}): ${firebaseError.message}`;
      }
      toast({ title: "Photo Update Error", description, variant: "destructive", duration: 10000 });
      return null;
    }
  }, [toast, updateUserProfile]);

  const saveOtherProfileData = useCallback(async (data: Omit<OtherProfileData, 'firestoreUpdatedAt'>): Promise<boolean> => {
    const currentSdkUser = auth.currentUser;
    if (!currentSdkUser) {
      console.error("[AuthContext] saveOtherProfileData critical error: No authenticated user found via SDK check. Aborting save.");
      toast({ title: "Not Authenticated", description: "You must be logged in to save profile details.", variant: "destructive" });
      return false;
    }
    const userId = currentSdkUser.uid;
    if (user && user.uid !== userId) {
        console.warn(`[AuthContext] saveOtherProfileData: Context user (${user.uid}) mismatch with SDK user (${userId}). This is unexpected if onAuthStateChanged is working correctly. Proceeding with SDK user ID.`);
    }
    const profileDocPath = `profiles/${userId}`;
    console.log(`[AuthContext] Attempting to SET doc: ${profileDocPath} for user ${userId} with data:`, data);
    try {
      const profileDocRef = doc(db, "profiles", userId);
      const dataToSave = { ...data, firestoreUpdatedAt: serverTimestamp() };
      await setDoc(profileDocRef, dataToSave, { merge: true });
      console.log(`[AuthContext] Other profile data saved for ${profileDocPath}. Fetching updated data.`);
      await fetchOtherProfileData(userId); 
      return true;
    } catch (e: any) {
      if (e.code === 'permission-denied' || e.code === 7) { 
        handleFirestorePermissionError('save', e, profileDocPath);
      } else {
        console.error(`[AuthContext] Firestore error in saveOtherProfileData for ${profileDocPath} (User: ${userId}):`, e.message, e.code, e);
        toast({ title: "Profile Save Error", description: e.message || "Failed to save additional profile details.", variant: "destructive" });
      }
      return false;
    }
  }, [toast, fetchOtherProfileData, user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    const currentSdkUser = auth.currentUser;
    if (!currentSdkUser || !currentSdkUser.email) {
      console.error("[AuthContext] changePassword critical error: No user or user email is available via SDK check.");
      toast({ title: "Not Authenticated", description: "You must be logged in to change your password.", variant: "destructive" });
      return false;
    }
    const userEmail = currentSdkUser.email;
    const userId = currentSdkUser.uid;
    console.log(`[AuthContext] Attempting to change password for user: ${userId} (${userEmail})`);
    try {
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      console.log(`[AuthContext] Reauthenticating user ${userId} for password change...`);
      await reauthenticateWithCredential(currentSdkUser, credential);
      console.log(`[AuthContext] User ${userId} reauthenticated. Updating password.`);
      await firebaseUpdatePassword(currentSdkUser, newPassword);
      console.log(`[AuthContext] Password changed successfully for user: ${userId}`);
      toast({ title: "Password Changed Successfully", description: "Your password has been updated." });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Password change error for user ${userId}:`, authError.message, authError.code, authError);
      let errorMessage = `Failed to change password. (Code: ${authError.code || 'unknown'})`;
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
    const currentSdkUser = auth.currentUser;
    if (!currentSdkUser || !currentSdkUser.email) {
      console.error("[AuthContext] updateUserEmailWithVerification critical error: No user or user email is available via SDK check.");
      toast({ title: "Not Authenticated", description: "You must be logged in to change your email.", variant: "destructive" });
      return false;
    }
    const oldEmail = currentSdkUser.email;
    const userId = currentSdkUser.uid;
    console.log(`[AuthContext] Attempting to update email for user: ${userId} from ${oldEmail} to ${newEmail}`);
    try {
      const credential = EmailAuthProvider.credential(oldEmail, currentPassword);
      console.log(`[AuthContext] Reauthenticating user ${userId} for email change...`);
      await reauthenticateWithCredential(currentSdkUser, credential);
      console.log(`[AuthContext] User ${userId} reauthenticated. Sending verification email to ${newEmail}.`);
      await verifyBeforeUpdateEmail(currentSdkUser, newEmail);
      console.log(`[AuthContext] Verification email sent to ${newEmail} for user ${userId}.`);
      toast({
        title: "Verification Email Sent",
        description: `A verification email has been sent to ${newEmail}. Please check your inbox and follow the instructions to complete the email change. Your current email remains active until then.`,
        duration: 10000,
      });
      return true;
    } catch (e) {
      const authError = e as AuthError;
      console.error(`[AuthContext] Email update error for user ${userId}:`, authError.message, authError.code, authError);
      let errorMessage = `Failed to initiate email change. (Code: ${authError.code || 'unknown'})`;
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
    guestId,
    isGuest,
    loading: initialLoading,
    otherProfileData,
    otherProfileDataLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    startNewGuestSession,
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

    