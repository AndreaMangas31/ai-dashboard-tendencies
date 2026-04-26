"use client";

import { TrendItem } from "@/lib/api";
import { TrendCard } from "../TrendCard";
import { SkeletonLoader } from "../SkeletonLoader";
import { Source } from "@/lib/api/types";

interface SourceColumnProps {
  source: Source;
  items: TrendItem[];
  loading: boolean;
  filter: string;
}

const SOURCE_INFO: Record<
  string,
  { icon: string; name: string; color: string; bgColor: string }
> = {
  hackernews: {
    icon: "⬆️",
    name: "Hacker News",
    color: "text-hn-orange",
    bgColor: "bg-orange-900/20",
  },
  reddit: {
    icon: "🔗",
    name: "Reddit",
    color: "text-reddit-red",
    bgColor: "bg-red-900/20",
  },
  producthunt: {
    icon: "🎯",
    name: "Product Hunt",
    color: "text-ph-purple",
    bgColor: "bg-purple-900/20",
  },
  dev_community: {
    icon: "💻",
    name: "Dev Community",
    color: "text-dev-blue",
    bgColor: "bg-blue-900/20",
  },
};

export function SourceColumn({
  source,
  items,
  loading,
  filter,
}: SourceColumnProps) {
  const info = SOURCE_INFO[source];
  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <div className="flex flex-col h-full min-h-screen md:min-h-[calc(100vh-120px)]">
      {/* Header */}
      <div
        className={`sticky top-0 z-10 ${info.bgColor} px-4 py-4 rounded-lg mb-4 border border-slate-700`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{info.icon}</span>
          <h2 className={`font-bold text-lg ${info.color}`}>{info.name}</h2>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? "Loading..." : `${filteredItems.length} trending`}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-3 pb-8">
        {loading ? (
          // Skeleton loaders
          <>
            {[...Array(5)].map((_, i) => (
              <SkeletonLoader key={i} />
            ))}
          </>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => <TrendCard key={item.id} item={item} />)
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No trends found</p>
          </div>
        )}
      </div>
    </div>
  );
}
