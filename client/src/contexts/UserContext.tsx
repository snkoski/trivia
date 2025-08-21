import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface UserContextType {
  username: string | null;
  setUsername: (username: string) => void;
  clearUsername: () => void;
  hasUsername: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'trivia-username';

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [username, setUsernameState] = useState<string | null>(null);

  // Load username from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUsernameState(stored);
    }
  }, []);

  const setUsername = (newUsername: string) => {
    const trimmed = newUsername.trim();
    if (trimmed) {
      setUsernameState(trimmed);
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
  };

  const clearUsername = () => {
    setUsernameState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: UserContextType = {
    username,
    setUsername,
    clearUsername,
    hasUsername: Boolean(username)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};