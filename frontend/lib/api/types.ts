export interface TrendItem {
  id: string;
  source: Source;
  title: string;
  url: string;
  score: number;
  comments: number;
  category: Category;
  timestamp: string;
}
export type Source = "hackernews" | "reddit" | "producthunt" | "dev_community";

export const CategoryLabels = {
  all: { label: "All" },
  ai: { label: "AI" },
  web: { label: "Web" },
  tools: { label: "Tools" },
} as const;

export type Category = keyof typeof CategoryLabels;

export interface TrendsResponse {
  items: TrendItem[];
  fetched_at: string;
}
