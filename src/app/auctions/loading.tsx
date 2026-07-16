import { Skeleton } from "@/components/loader";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* filter chips */}
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />

      {/* auction grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-2.5 w-12" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
