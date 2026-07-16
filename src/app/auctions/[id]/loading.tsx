import { Skeleton } from "@/components/loader";

export default function Loading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* command-center header */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-white">
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-80" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-3 w-40" />
              <div className="flex justify-end gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-14 rounded-lg" />
                ))}
              </div>
              <Skeleton className="ml-auto h-3 w-56" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 bg-white px-4 py-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* main grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* standings */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
            <ul className="divide-y divide-slate-100">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-9 w-10 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-60" />
                  </div>
                  <div className="space-y-1.5 text-right">
                    <Skeleton className="ml-auto h-5 w-24" />
                    <Skeleton className="ml-auto h-3 w-40" />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* activity log */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-3.5 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="px-5 py-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="card p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
