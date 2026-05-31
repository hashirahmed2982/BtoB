"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export function useLockedGuard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && (user.status === "locked" || user.status === "permanently_blocked")) {
      logout(); // clears localStorage and redirects to /login
    }
  }, [user]);
}