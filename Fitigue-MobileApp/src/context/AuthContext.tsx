import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/apiClient';

interface User {
  id: string;
  username: string;
  email: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, gender: string, age: number) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  getProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Web-compatible storage
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }
  // Use AsyncStorage for native platforms
  return {
    getItem: (key: string) => AsyncStorage.getItem(key),
    setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
    removeItem: (key: string) => AsyncStorage.removeItem(key),
  };
};

const storage = getStorage();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    // Skip session restoration in web mode to avoid AsyncStorage errors
    if (typeof window !== 'undefined' && window.localStorage) {
      setIsLoading(false);
      return;
    }

    try {
      const storedToken = await storage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Only verify token if we have a stored token and backend might be available
        try {
          const profile = await authAPI.getProfile();
          setUser(profile);
        } catch (error: any) {
          // If it's a network error (backend not running), keep the token but don't set user
          if (error.status === 0) {
            console.warn('Backend not available, keeping stored token for later verification');
          } else {
            // Token is invalid, clear it
            console.warn('Token verification failed, clearing stored token');
            await storage.removeItem('authToken');
            setToken(null);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token: authToken, user: userData } = response;

      await storage.setItem('authToken', authToken);
      setToken(authToken);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    gender: string,
    age: number
    ) => {
    try {
        const response = await authAPI.register({
        username,
        email,
        password,
        gender,
        age,
        });
        const { token: authToken, user: userData } = response || {};
        if (authToken && userData) {
          await storage.setItem('authToken', authToken);
          setToken(authToken);
          setUser(userData);
          return;
        }

        // Backward compatibility if backend only returns message on register.
        await login(username, password);
    } catch (error) {
        throw error;
    }
    };

  const clearSession = async () => {
    await storage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const deleteAccount = async () => {
    await authAPI.deleteAccount();
    await clearSession();
  };

  const getProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isSignedIn: !!token,
    login,
    register,
    logout,
    deleteAccount,
    getProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
