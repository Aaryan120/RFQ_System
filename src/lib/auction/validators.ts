import { z } from "zod";

export const ExtensionTriggerSchema = z.enum([
  "BID_RECEIVED",
  "ANY_RANK_CHANGE",
  "L1_RANK_CHANGE",
]);

const positiveInt = z.coerce.number().int().positive();

const isoDate = z.coerce.date();

export const CreateRfqSchema = z
  .object({
    referenceId: z
      .string()
      .trim()
      .min(3, "Reference ID must be at least 3 characters")
      .max(64),
    name: z.string().trim().min(3, "Name is required").max(200),
    bidStartAt: isoDate,
    bidCloseAt: isoDate,
    forcedBidCloseAt: isoDate,
    pickupDate: isoDate,
    triggerWindowMinutes: positiveInt.max(24 * 60, "Trigger window too large"),
    extensionDurationMinutes: positiveInt.max(
      24 * 60,
      "Extension duration too large",
    ),
    extensionTrigger: ExtensionTriggerSchema,
  })
  .superRefine((val, ctx) => {
    if (val.bidStartAt >= val.bidCloseAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bidCloseAt"],
        message: "Bid close must be after bid start",
      });
    }
    if (val.forcedBidCloseAt <= val.bidCloseAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["forcedBidCloseAt"],
        message: "Forced bid close must be after bid close",
      });
    }
    if (val.pickupDate < val.bidCloseAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pickupDate"],
        message: "Pickup date must be on/after bid close",
      });
    }
  });

export type CreateRfqInput = z.infer<typeof CreateRfqSchema>;

const money = z.coerce
  .number()
  .nonnegative("Must be zero or positive")
  .refine((n) => Number.isFinite(n), "Invalid number");

export const SubmitBidSchema = z.object({
  carrierName: z.string().trim().min(2, "Carrier name is required").max(120),
  freightCharges: money,
  originCharges: money,
  destinationCharges: money,
  transitTimeDays: positiveInt.max(365),
  quoteValidity: isoDate,
});

export type SubmitBidInput = z.infer<typeof SubmitBidSchema>;
