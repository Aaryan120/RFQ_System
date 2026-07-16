import { Skeleton } from "@/components/loader";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-3 w-full max-w-md" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}
