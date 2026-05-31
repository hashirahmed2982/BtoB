"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AuthUser {
  user_id: number;
  full_name: string;
  email: string;
  role_name?: string;
  company_name?: string;
  status?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  getInitials: (name: string) => string;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      // If user is locked or blocked, clear session immediately
      if (parsed.status === "locked" || parsed.status === "permanently_blocked") {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }
      setUserState(parsed);
    }
  } catch {
    localStorage.removeItem("user");
  } finally {
    setIsLoading(false);
  }
}, []);

  const setUser = (user: AuthUser | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    setUserState(null);
    localStorage.clear();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, getInitials, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}