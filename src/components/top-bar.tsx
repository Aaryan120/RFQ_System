import Link from "next/link";
import { Gavel, LayoutGrid, PlusCircle } from "lucide-react";
import { signOut } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import type { Role } from "@prisma/client";

export function TopBar({
  user,
}: {
  user: { name: string; email: string; role: Role } | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-slate-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Gavel className="h-4 w-4" />
            </span>
            <span className="tracking-tight">
              British<span className="text-brand-600">RFQ</span>
            </span>
          </Link>
          {user && (
            <nav className="hidden items-center gap-1 text-sm font-medium text-slate-600 sm:flex">
              <Link
                href="/auctions"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
              >
                <LayoutGrid className="h-4 w-4" />
                Auctions
              </Link>
              {user.role === "BUYER" && (
                <Link
                  href="/rfq/new"
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
                >
                  <PlusCircle className="h-4 w-4" />
                  New RFQ
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-semibold text-slate-700">
                  {user.name
                    .split(" ")
                    .map((s) => s[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-slate-800">
                    {user.name}
                  </div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {user.role}
                  </div>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <SignOutButton />
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white shadow-soft hover:bg-brand-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
