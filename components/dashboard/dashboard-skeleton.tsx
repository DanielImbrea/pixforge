export function DashboardPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-md bg-background-secondary mb-6" />
      <div className="space-y-4">
        <div className="h-4 w-full max-w-md rounded bg-background-secondary" />
        <div className="h-4 w-3/4 max-w-sm rounded bg-background-secondary" />
        <div className="h-32 w-full max-w-md rounded-lg bg-background-secondary mt-6" />
      </div>
    </div>
  );
}

export function DashboardImagesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-md bg-background-secondary mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 rounded-lg bg-background-secondary" />
        ))}
      </div>
    </div>
  );
}

export function DashboardTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 rounded-md bg-background-secondary mb-6" />
      <div className="rounded-lg border border-border-default overflow-hidden">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 border-b border-border-default last:border-b-0 bg-background-secondary/40" />
        ))}
      </div>
    </div>
  );
}
