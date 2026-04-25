"use client";

import { useEffect, useState } from "react";
import { TrendItem } from "@/lib/api";
import { useFetchTrends } from "@/hooks/useFetchTrends";
import { SourceColumn } from "@/components/SourceColumn";
import { BriefingPanel } from "@/components/BriefingPanel";
import { RefreshBar } from "@/components/RefreshBar";

type Category = "all" | "ai" | "web" | "tools";

export default function Home() {
  const { data, loading, refetch } = useFetchTrends();
  const [briefingOpen, setBriefingOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");

  // Initial fetch
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        refetch();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [refetch]);

  const trends = data?.items || [];
  const fetchedAt = data?.fetched_at || null;

  const hackernewsItems = trends.filter((item) => item.source === "hackernews");
  const redditItems = trends.filter((item) => item.source === "reddit");
  const devCommunityItems = trends.filter(
    (item) => item.source === "dev_community",
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-700 py-6 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Tech Pulse
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <button
            onClick={() => setBriefingOpen(true)}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm
              transition-all duration-200 whitespace-nowrap
              ${
                briefingOpen
                  ? "bg-slate-700 text-slate-400"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/50 active:scale-95"
              }
            `}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Generate Brief
            </span>
          </button>
        </div>
      </header>

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Refresh Bar */}
        <RefreshBar
          fetchedAt={fetchedAt}
          onRefresh={refetch}
          loading={loading}
        />

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(["all", "ai", "web", "tools"] as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SourceColumn
            source="hackernews"
            items={hackernewsItems}
            loading={loading}
            filter={selectedCategory}
          />
          <SourceColumn
            source="reddit"
            items={redditItems}
            loading={loading}
            filter={selectedCategory}
          />
          <SourceColumn
            source="dev_community"
            items={devCommunityItems}
            loading={loading}
            filter={selectedCategory}
          />
        </div>
      </div>

      {/* Briefing Panel */}
      <BriefingPanel
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
      />
    </main>
  );
}
