import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { auth } from "@/lib/auth";
import { CreateRfqForm } from "@/components/create-rfq-form";

export default async function NewRfqPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "BUYER") redirect("/auctions");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/auctions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to auctions
      </Link>

      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          New RFQ
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Create a British Auction
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure the auction window and how bids should extend it. All rules
          are validated server-side.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-xs text-brand-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <b>British auction rule:</b> once a bid arrives within the trigger
          window before <i>Bid Close</i>, the auction extends by{" "}
          <i>Extension Duration</i>, up to (but never past) the{" "}
          <i>Forced Bid Close</i> time.
        </div>
      </div>

      <CreateRfqForm />
    </div>
  );
}
