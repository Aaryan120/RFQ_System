"use client";

import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/loader";
import { DemoCredentialPicker } from "@/components/demo-credential-picker";

interface Account {
  email: string;
  label: string;
  role: "BUYER" | "SUPPLIER";
}

export function LoginForm({
  login,
  accounts,
}: {
  login: (formData: FormData) => Promise<void>;
  accounts: Account[];
}) {
  return (
    <form
      action={login}
      className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft"
    >
      <DemoCredentialPicker accounts={accounts} />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Email
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue="buyer@gocomet.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
          Password
        </label>
        <input
          name="password"
          type="password"
          required
          defaultValue="demo123"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-soft focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          All demo accounts share the password{" "}
          <code className="rounded bg-slate-100 px-1 font-mono">demo123</code>.
        </p>
      </div>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? (
        <>
          <Spinner size="sm" className="text-white" />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
