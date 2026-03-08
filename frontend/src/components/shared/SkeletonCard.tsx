export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 animate-pulse">
      <div className="h-4 bg-elevated rounded-lg w-3/4 mb-3" />
      <div className="h-3 bg-elevated rounded-lg w-1/2 mb-6" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-elevated rounded-lg mb-2"
          style={{ width: `${70 + Math.random() * 30}%` }}
        />
      ))}
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 bg-elevated rounded-full" />
        <div className="h-6 w-20 bg-elevated rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-elevated" />
      <div className="flex-1">
        <div className="h-3 bg-elevated rounded w-1/3 mb-2" />
        <div className="h-2.5 bg-elevated rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-elevated rounded-full" />
    </div>
  );
}
