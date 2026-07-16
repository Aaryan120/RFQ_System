"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ intervalSeconds = 15 }: { intervalSeconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalSeconds * 1000);
    return () => clearInterval(t);
  }, [router, intervalSeconds]);
  return null;
}
