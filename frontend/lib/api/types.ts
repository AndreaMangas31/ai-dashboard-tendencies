export interface TrendItem {
  id: string;
  source: 'hackernews' | 'reddit' | 'producthunt';
  title: string;
  url: string;
  score: number;
  comments: number;
  category: 'ai' | 'web' | 'tools' | 'other';
  timestamp: string;
}

export interface TrendsResponse {
  items: TrendItem[];
  fetched_at: string;
}
