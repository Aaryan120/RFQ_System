"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Account {
  email: string;
  label: string;
  role: "BUYER" | "SUPPLIER";
}

export function DemoCredentialPicker({ accounts }: { accounts: Account[] }) {
  const [selected, setSelected] = useState(accounts[0].email);

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Quick-pick demo account
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {accounts.map((a) => {
          const active = a.email === selected;
          return (
            <button
              type="button"
              key={a.email}
              onClick={() => {
                setSelected(a.email);
                const el = document.querySelector<HTMLInputElement>(
                  'input[name="email"]',
                );
                if (el) el.value = a.email;
              }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-500/20"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{a.label}</span>
                <span className="block truncate text-[10px] text-slate-500">
                  {a.email}
                </span>
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                  a.role === "BUYER"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-emerald-100 text-emerald-700",
                )}
              >
                {a.role}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
