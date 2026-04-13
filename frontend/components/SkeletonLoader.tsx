export const SkeletonLoader = () => (
  <div className="bg-slate-800 rounded-lg p-4 space-y-3 animate-pulse">
    <div className="h-5 bg-slate-700 rounded w-3/4" />
    <div className="h-4 bg-slate-700 rounded w-1/2" />
    <div className="flex gap-2">
      <div className="h-6 bg-slate-700 rounded w-16" />
      <div className="h-6 bg-slate-700 rounded w-12" />
    </div>
  </div>
);
