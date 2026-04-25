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
export type Category = "all" | "ai" | "web" | "tools";

export interface TrendsResponse {
  items: TrendItem[];
  fetched_at: string;
}
