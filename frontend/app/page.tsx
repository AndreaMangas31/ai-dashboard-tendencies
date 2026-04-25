"use client";

import { useEffect, useState } from "react";
import { TrendItem } from "@/lib/api";
import { useFetchTrends } from "@/hooks/useFetchTrends";
import { SourceColumn } from "@/components/SourceColumn";
import { BriefingPanel } from "@/components/BriefingPanel";
import { RefreshBar } from "@/components/RefreshBar";
import { Header } from "@/components/Header";
import { Category, Source } from "@/lib/api/types";
import { CategoryFilter } from "@/components/CategoryFilter";

export default function Home() {
  const {
    briefingOpen,
    setBriefingOpen,
    selectedCategory,
    setSelectedCategory,
    itemsBySource,
    fetchedAt,
    loading,
    refetch,
  } = useHomeLogic();

  const columnItems = itemsBySource?.map(({ source, items }) => (
    <SourceColumn
      key={source}
      source={source}
      items={items}
      loading={loading}
      filter={selectedCategory}
    />
  ));

  return (
    <main className="min-h-screen bg-gradient-to-br from-tech-black-900 via-tech-black-800 to-tech-black-900">
      {/* Header */}
      <Header briefingOpen={briefingOpen} setBriefingOpen={setBriefingOpen} />

      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Refresh Bar */}
        <RefreshBar
          fetchedAt={fetchedAt}
          onRefresh={refetch}
          loading={loading}
        />

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
        {/* Three Column Layout */}
        {columnItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columnItems}
          </div>
        ) : (
          <span className="text-slate-400">No trends available.</span>
        )}
      </div>

      {/* Briefing Panel */}
      <BriefingPanel
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
      />
    </main>
  );
}

const useHomeLogic = () => {
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
  const itemsBySource: { source: Source; items: TrendItem[] }[] = [
    { source: "hackernews", items: hackernewsItems },
    { source: "reddit", items: redditItems },
    { source: "dev_community", items: devCommunityItems },
  ];
  return {
    briefingOpen,
    setBriefingOpen,
    selectedCategory,
    setSelectedCategory,
    itemsBySource,
    fetchedAt,
    loading,
    refetch,
  };
};
