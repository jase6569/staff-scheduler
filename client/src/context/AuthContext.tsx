import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Role = 'admin' | 'staff';

interface AuthState {
  isAuthenticated: boolean;
  role: Role | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: Role | null;
  isAdmin: boolean;
  login: (password?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'admin123'; // Change this to your preferred password
const STORAGE_KEY = 'staff-scheduler-auth';

interface StoredAuth {
  role: Role;
  expiresAt: number;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: StoredAuth = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          setAuth({
            isAuthenticated: true,
            role: parsed.role,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const login = (password?: string): boolean => {
    let role: Role;
    
    if (password) {
      // Admin login with password
      if (password === ADMIN_PASSWORD) {
        role = 'admin';
      } else {
        return false;
      }
    } else {
      // Staff view (no password required)
      role = 'staff';
    }

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ role, expiresAt }));
    
    setAuth({
      isAuthenticated: true,
      role,
    });
    
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({
      isAuthenticated: false,
      role: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: auth.isAuthenticated,
        role: auth.role,
        isAdmin: auth.role === 'admin',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
