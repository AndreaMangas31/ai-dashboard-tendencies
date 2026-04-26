"use client";

import { TrendItem } from "@/lib/api";
import { TrendCard } from "../TrendCard";
import { SkeletonLoader } from "../SkeletonLoader";
import { Source } from "@/lib/api/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { SOURCE_CLASS } from "@/lib/helpers/colorCards";

interface SourceColumnProps {
  source: Source;
  items: TrendItem[];
  loading: boolean;
  filter: string;
}

export function SourceColumn({
  source,
  items,
  loading,
  filter,
}: SourceColumnProps) {
  const info = SOURCE_CLASS[source];
  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <div className="flex flex-col gap-4 h-full min-h-screen md:min-h-[calc(100vh-120px)]">
      {/* Header */}
      {/* ${info.bgColor} */}
      <div
        className={`sticky top-0 z-10  flex bg-tech-black-950 flex-row  items-center justify-between px-4 py-4 rounded-lg  border border-slate-700`}
      >
        <div className="flex items-center gap-2 ">
          <img
            src={info.icon}
            alt={info.name}
            className="w-8 h-8 border rounded-md bg-white"
          />
          <h2 className={`font-bold text-lg ${info.color}`}>{info.name}</h2>
        </div>
        {loading ? (
          <FontAwesomeIcon
            icon={faSpinner}
            className={`w-4 h-4 text-white animate-spin`}
          />
        ) : (
          <p className="text-sm text-white">{filteredItems.length} trending</p>
        )}
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
