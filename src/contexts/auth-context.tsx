
"use client";

import type { ReactNode } from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from 'react';
import { GUEST_ID_STORAGE_KEY } from '@/lib/constants';
import { useRouter } from 'next/navigation'; // Keep for navigation if needed

// Minimal AuthContext for Guest-Only
interface AuthContextType {
  guestId: string | null;
  isGuest: boolean;
  loading: boolean; // Indicates if initial guest ID check is complete
  startNewGuestSession: (clearPreviousData?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [guestId, setGuestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const isGuest = !!guestId;

  // Effect to load guest ID from localStorage on initial client mount
  useEffect(() => {
    console.log("[AuthContext] Initializing guest session check.");
    const storedGuestId = localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (storedGuestId) {
      console.log(`[AuthContext] Restored guest session ID: ${storedGuestId}`);
      setGuestId(storedGuestId);
    } else {
      console.log("[AuthContext] No existing guest session ID found.");
      // Optionally, auto-start a new guest session if none exists:
      // startNewGuestSession(false); // Call with false to not clear data (as there's none)
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  const startNewGuestSession = useCallback((clearPreviousData: boolean = true) => {
    console.log(`[AuthContext] Starting new guest session. Clear previous data: ${clearPreviousData}`);
    if (clearPreviousData) {
        // Construct keys based on APP_NAME if they are dynamically generated
        const appPrefix = GUEST_ID_STORAGE_KEY.split('_guest_id_v1')[0]; // Infer prefix
        localStorage.removeItem(`${appPrefix}_guest_tasks_v2`);
        localStorage.removeItem(`${appPrefix}_guest_columns_v2`);
        console.log("[AuthContext] Cleared previous guest task and column data from localStorage.");
    }
    const newGuestId = `guest-${crypto.randomUUID().substring(0, 8)}`;
    setGuestId(newGuestId);
    localStorage.setItem(GUEST_ID_STORAGE_KEY, newGuestId);
    console.log(`[AuthContext] New guest session started with ID: ${newGuestId}.`);
    // Optionally navigate to home or refresh to reflect new state if called from profile page
    // router.push('/'); // Removed to avoid automatic navigation from anywhere
  }, []);


  const value = {
    guestId,
    isGuest,
    loading,
    startNewGuestSession,
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
