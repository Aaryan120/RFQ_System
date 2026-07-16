import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AuctionError, submitBid } from "@/lib/auction/engine";
import { SubmitBidSchema } from "@/lib/auction/validators";
import { revalidatePath } from "next/cache";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Only suppliers can bid" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SubmitBidSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!errors[key]) errors[key] = issue.message;
    }
    return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
  }

  try {
    const result = await submitBid({
      rfqId: id,
      supplierId: session.user.id,
      input: parsed.data,
    });
    revalidatePath(`/auctions/${id}`);
    revalidatePath("/auctions");
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuctionError) {
      const status =
        err.code === "NOT_FOUND"
          ? 404
          : err.code === "NOT_STARTED"
            ? 409
            : 409;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status },
      );
    }
    console.error("submitBid failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
