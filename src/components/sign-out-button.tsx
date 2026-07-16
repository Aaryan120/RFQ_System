"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/loader";

export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-soft transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <Spinner size="xs" className="text-slate-500" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
