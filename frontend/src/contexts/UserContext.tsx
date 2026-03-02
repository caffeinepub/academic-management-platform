import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'acadmind_gemini_api_key';

interface UserContextValue {
  geminiApiKey: string | null;
  updateGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const updateGeminiApiKey = (key: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // ignore storage errors
    }
    setGeminiApiKey(key);
  };

  const clearGeminiApiKey = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    setGeminiApiKey(null);
  };

  return (
    <UserContext.Provider value={{ geminiApiKey, updateGeminiApiKey, clearGeminiApiKey }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
