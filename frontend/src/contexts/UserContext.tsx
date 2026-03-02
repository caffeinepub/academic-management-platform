import { createContext, useContext, useState, type ReactNode } from 'react';

const STORAGE_KEY_API = 'acadmind_gemini_api_key';
const STORAGE_KEY_USER = 'acadmind_user_id';

interface UserContextValue {
  geminiApiKey: string | null;
  updateGeminiApiKey: (key: string) => void;
  clearGeminiApiKey: () => void;
  userId: string | null;
  updateUserId: (id: string) => void;
  clearUserId: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_API) || null;
    } catch {
      return null;
    }
  });

  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_USER) || null;
    } catch {
      return null;
    }
  });

  const updateGeminiApiKey = (key: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_API, key);
    } catch {
      // ignore storage errors
    }
    setGeminiApiKey(key);
  };

  const clearGeminiApiKey = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_API);
    } catch {
      // ignore storage errors
    }
    setGeminiApiKey(null);
  };

  const updateUserId = (id: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, id);
    } catch {
      // ignore storage errors
    }
    setUserId(id);
  };

  const clearUserId = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // ignore storage errors
    }
    setUserId(null);
  };

  return (
    <UserContext.Provider
      value={{
        geminiApiKey,
        updateGeminiApiKey,
        clearGeminiApiKey,
        userId,
        updateUserId,
        clearUserId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
