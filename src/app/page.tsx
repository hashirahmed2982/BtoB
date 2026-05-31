"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLockedGuard } from "./hooks/useLockedGuard";

export default function Page() {
  const router = useRouter();
  useLockedGuard();

  useEffect(() => {
    // Redirect all traffic from root to login
    router.replace("/login");
  }, [router]);

  return null;
}
