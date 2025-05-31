
"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // Always initialize with initialValue for the first render pass on both client and server.
  // This ensures server and client render the same thing initially.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to load from localStorage only on the client, after mount.
  useEffect(() => {
    // This check is technically not needed here as useEffect only runs on client,
    // but it's good practice and harmless.
    if (typeof window !== "undefined") {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
        // Optional: If you want to set the initialValue to localStorage if it's not there yet.
        // else {
        //   window.localStorage.setItem(key, JSON.stringify(initialValue));
        // }
      } catch (error) {
        console.error(`Error reading localStorage key “${key}”:`, error);
        // Fallback to initialValue if parsing fails or any other error.
        // setStoredValue(initialValue); // Already set, but can be explicit.
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes (though typically, key is constant for a hook instance)

  const setValue: SetValue<T> = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue];
}
