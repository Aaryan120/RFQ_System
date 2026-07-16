import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import {
  Gavel,
  ShieldCheck,
  Timer,
  Trophy,
} from "lucide-react";
import { auth, signIn } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

const DEMO_ACCOUNTS = [
  { email: "buyer@gocomet.com", label: "Buyer", role: "BUYER" as const },
  { email: "supplier1@gocomet.com", label: "Acme Freight", role: "SUPPLIER" as const },
  { email: "supplier2@gocomet.com", label: "Globex Logistics", role: "SUPPLIER" as const },
  { email: "supplier3@gocomet.com", label: "Initech Shipping", role: "SUPPLIER" as const },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/auctions");
  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/auctions",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/login?error=${encodeURIComponent(err.type)}`);
      }
      throw err;
    }
  }

  return (
    <div className="-mx-4 -my-8 grid min-h-[calc(100vh-64px)] grid-cols-1 sm:-mx-6 lg:-mx-8 lg:grid-cols-2">
      {/* Hero panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 40%), radial-gradient(circle at 80% 60%, rgba(16,185,129,0.25), transparent 40%)",
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur">
            <Gavel className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-tight">
              BritishRFQ
            </span>
          </div>
          <h1 className="mt-12 max-w-md text-4xl font-bold leading-tight tracking-tight">
            Fair competition.
            <br />
            No last-second wins.
          </h1>
          <p className="mt-4 max-w-md text-brand-100/90">
            A simplified RFQ system with British-Auction bidding — automatic
            time extensions, hard forced-close, and live supplier rankings.
          </p>
        </div>

        <ul className="relative mt-10 space-y-4">
          <FeatureRow
            icon={<Timer className="h-5 w-5" />}
            title="Automatic time extensions"
            body="Bids arriving in the trigger window extend the auction — capped by a hard forced close."
          />
          <FeatureRow
            icon={<Trophy className="h-5 w-5" />}
            title="Live L1 / L2 / L3 rankings"
            body="Every supplier sees their current standing update in real time."
          />
          <FeatureRow
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Full audit trail"
            body="Every bid and extension is logged with a reason and timestamp."
          />
        </ul>

        <div className="relative text-xs text-brand-200/80">
          Demo build · Next.js · Prisma · PostgreSQL
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <div className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-white">
              <Gavel className="h-4 w-4" />
              <span className="text-sm font-semibold">BritishRFQ</span>
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Sign in with a demo account to explore the auction system.
          </p>

          {params.error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Invalid email or password. Try again.
            </div>
          )}

          <LoginForm login={login} accounts={DEMO_ACCOUNTS} />

          <p className="mt-6 text-center text-xs text-slate-500">
            Curious how it works?{" "}
            <Link
              href="/auctions"
              className="font-medium text-brand-600 hover:underline"
            >
              Read the docs →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur">
        {icon}
      </span>
      <div>
        <div className="font-semibold text-white">{title}</div>
        <div className="text-sm text-brand-100/80">{body}</div>
      </div>
    </li>
  );
}
