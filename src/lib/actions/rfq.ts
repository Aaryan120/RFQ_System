"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeStatus } from "@/lib/auction/engine";
import { CreateRfqSchema } from "@/lib/auction/validators";

export interface CreateRfqActionState {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
}

export async function createRfqAction(
  _prev: CreateRfqActionState,
  formData: FormData,
): Promise<CreateRfqActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "BUYER") {
    return { ok: false, message: "Only buyers can create RFQs" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateRfqSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors, message: "Please fix the errors below" };
  }

  const data = parsed.data;

  // Check for duplicate reference id up front for a nicer error message.
  const dup = await prisma.rfq.findUnique({
    where: { referenceId: data.referenceId },
  });
  if (dup) {
    return {
      ok: false,
      errors: { referenceId: "Reference ID already in use" },
      message: "Please fix the errors below",
    };
  }

  const initialStatus = computeStatus({
    status: "SCHEDULED",
    bidStartAt: data.bidStartAt,
    bidCloseAt: data.bidCloseAt,
    forcedBidCloseAt: data.forcedBidCloseAt,
  });

  const rfq = await prisma.rfq.create({
    data: {
      referenceId: data.referenceId,
      name: data.name,
      bidStartAt: data.bidStartAt,
      bidCloseAt: data.bidCloseAt,
      forcedBidCloseAt: data.forcedBidCloseAt,
      pickupDate: data.pickupDate,
      status: initialStatus,
      createdById: session.user.id,
      config: {
        create: {
          triggerWindowMinutes: data.triggerWindowMinutes,
          extensionDurationMinutes: data.extensionDurationMinutes,
          extensionTrigger: data.extensionTrigger,
        },
      },
    },
  });

  revalidatePath("/auctions");
  redirect(`/auctions/${rfq.id}`);
}
