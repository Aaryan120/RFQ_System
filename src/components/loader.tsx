import { cn } from "@/lib/utils";

export function Spinner({
  size = "sm",
  className,
  label,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string;
}) {
  const dim =
    size === "xs"
      ? "h-3 w-3 border-[1.5px]"
      : size === "sm"
        ? "h-4 w-4 border-2"
        : size === "md"
          ? "h-6 w-6 border-2"
          : "h-8 w-8 border-[3px]";
  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn(
        "inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em]",
        dim,
        className,
      )}
    />
  );
}

/** Simple animated skeleton block using the shimmer utility from globals.css */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function FullPageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner size="lg" className="text-brand-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
