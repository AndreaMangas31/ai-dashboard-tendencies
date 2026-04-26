"use client";

import { TrendItem } from "@/lib/api";
import {
  CATEGORY_COLORS,
  SOURCE_BORDER_COLORS,
} from "@/lib/helpers/colorCards";

interface TrendCardProps {
  item: TrendItem;
}

export function TrendCard({ item }: TrendCardProps) {
  const relativeTime = getRelativeTime(item.timestamp);
  const borderColor = SOURCE_BORDER_COLORS[item.source] || "border-slate-600";
  const categoryColor = CATEGORY_COLORS[item.category];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        block p-4 rounded-lg border-l-4 ${borderColor} 
        bg-card hover:bg-purple-600/40
        transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer
        animate-fade-in
      `}
    >
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-6 line-clamp-2 text-slate-100">
          {item.title}
        </h3>

        {/* Category and Time badges */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs px-2 py-1 rounded-full ${categoryColor} font-medium`}
          >
            {item.category}
          </span>
          <span className="text-xs text-slate-400">{relativeTime}</span>
        </div>

        {/* Score and comments */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v-6a1.5 1.5 0 00-3 0v6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.256 8H6z" />
            </svg>
            <span className="font-medium text-slate-300">{item.score}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0L10 9.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
            <span className="font-medium text-slate-300">{item.comments}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
