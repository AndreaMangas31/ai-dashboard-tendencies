export function BriefingLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <p className="text-slate-400 text-sm">Generating briefing...</p>
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-slate-700 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-700 rounded w-5/6 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
