"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

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
  const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms
  const timerRef = useRef<number | null>(null);
  const activityHandlerRef = useRef<() => void | null>(null);

  useEffect(() => {
    // On app load, rehydrate user from localStorage
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUserState(JSON.parse(stored));
      // If there's a lastActivity timestamp, check expiry and clear if needed
      const last = localStorage.getItem("lastActivity");
      if (last && stored) {
        const lastTs = Number(last) || 0;
        const now = Date.now();
        if (now - lastTs > SESSION_TIMEOUT) {
          // session expired
          localStorage.removeItem("user");
          localStorage.removeItem("lastActivity");
          // do not redirect here — allow UI to mount and handle
        }
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
      // record activity and start session timer
      try { localStorage.setItem("lastActivity", String(Date.now())); } catch {}
      // schedule timer will be handled by effect below when `user` changes
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    // Clear user and session data, cancel timer and redirect to login
    setUserState(null);
    try {
      localStorage.clear();
    } catch {}
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    window.location.href = "/login";
  };

  // Start / reset session timeout (clears existing timer and schedules logout)
  const scheduleSessionTimeout = (delay = SESSION_TIMEOUT) => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setTimeout(() => {
      // session expired
      setUserState(null);
      try { localStorage.removeItem("user"); localStorage.removeItem("lastActivity"); } catch {}
      window.location.href = "/login";
    }, delay) as unknown as number;
  };

  // Update last activity timestamp and reset timer
  const updateLastActivity = () => {
    try { localStorage.setItem("lastActivity", String(Date.now())); } catch {}
    scheduleSessionTimeout();
  };

  // Attach activity listeners whenever a user is present
  useEffect(() => {
    // cleanup previous
    if (activityHandlerRef.current) {
      const handler = activityHandlerRef.current;
      ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev => window.removeEventListener(ev, handler));
      activityHandlerRef.current = null;
    }

    if (!user) {
      // ensure no timer when logged out
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // start / resume session timeout based on last activity
    const last = Number(localStorage.getItem("lastActivity") || "0") || Date.now();
    const elapsed = Date.now() - last;
    const remaining = Math.max(0, SESSION_TIMEOUT - elapsed);
    scheduleSessionTimeout(remaining || SESSION_TIMEOUT);

    const activityHandler = () => {
      updateLastActivity();
    };
    activityHandlerRef.current = activityHandler;
    ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, activityHandler));

    return () => {
      if (activityHandlerRef.current) {
        const handler = activityHandlerRef.current;
        ["mousemove", "keydown", "click", "touchstart", "scroll"].forEach(ev => window.removeEventListener(ev, handler));
        activityHandlerRef.current = null;
      }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user]);

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