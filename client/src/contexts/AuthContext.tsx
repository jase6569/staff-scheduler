import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'admin' | 'staff' | null;

interface AuthContextType {
  role: UserRole;
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (password: string) => Promise<boolean>;
  loginAsStaff: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PASSWORD = 'admin123'; // Change this to your preferred password
const AUTH_STORAGE_KEY = 'staff-scheduler-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    // Check for saved auth on mount
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const { role: savedRole, expiry } = JSON.parse(saved);
        if (expiry > Date.now()) {
          setRole(savedRole);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const saveAuth = (newRole: UserRole) => {
    if (newRole) {
      // Auth expires in 7 days
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ role: newRole, expiry }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const login = async (password: string): Promise<boolean> => {
    // Simple password check - in production, this should be server-side
    if (password === ADMIN_PASSWORD) {
      setRole('admin');
      saveAuth('admin');
      return true;
    }
    return false;
  };

  const loginAsStaff = () => {
    setRole('staff');
    saveAuth('staff');
  };

  const logout = () => {
    setRole(null);
    saveAuth(null);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        isAdmin: role === 'admin',
        isLoggedIn: role !== null,
        login,
        loginAsStaff,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
