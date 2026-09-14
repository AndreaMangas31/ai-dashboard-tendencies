export type Category = "ai" | "web" | "tools" | "other";

export interface TrendItem {
  id: string;
  source: "hackernews" | "reddit" | "producthunt" | "dev_community";
  title: string;
  url: string;
  score: number;
  comments: number;
  category: Category;
  timestamp: string;
}

export function categorize(text: string): Category {
  const t = text.toLowerCase();
  if (/(ai|llm|gpt|claude|transformer|neural|machine learning|deep learning|agent)/.test(t)) {
    return "ai";
  }
  if (/(javascript|typescript|react|vue|svelte|nextjs|html|css|frontend|web)/.test(t)) {
    return "web";
  }
  if (/(tool|cli|library|framework|open source|github|saas)/.test(t)) {
    return "tools";
  }
  return "other";
}

function htmlUnescape(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchHackerNews(): Promise<TrendItem[]> {
  try {
    const res = await fetch(
      "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=20",
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.hits ?? [])
      .filter((hit: { title?: string; objectID?: string }) => hit?.title && hit?.objectID)
      .map(
        (hit: {
          objectID: string;
          title?: string;
          url?: string;
          points?: number;
          num_comments?: number;
          created_at?: string;
        }) => {
          const title = hit.title ?? "";
          const url = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
          return {
            id: `hn-${hit.objectID}`,
            source: "hackernews" as const,
            title,
            url,
            score: hit.points ?? 0,
            comments: hit.num_comments ?? 0,
            category: categorize(`${title} ${url}`),
            timestamp: hit.created_at ?? new Date().toISOString(),
          };
        },
      );
  } catch {
    return [];
  }
}

export async function fetchReddit(): Promise<TrendItem[]> {
  try {
    const res = await fetch("https://www.reddit.com/r/programming+technology/.rss", {
      headers: {
        "User-Agent": "TechPulseDashboard/1.0 (news-aggregator)",
        Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 30);
    const posts: TrendItem[] = [];
    for (const match of entries) {
      const block = match[1];
      const titleMatch = block.match(/<title>(?:<!\[CDATA\[(.*?)\]\]>|(.*?))<\/title>/);
      const title = htmlUnescape((titleMatch?.[1] || titleMatch?.[2] || "").trim());
      if (!title || title.toLowerCase().startsWith("announcement")) continue;
      const atomId = block.match(/<id>(.*?)<\/id>/)?.[1] ?? "";
      const postId = atomId.replace("t3_", "");
      const commentsUrl = block.match(/<link href="([^"]+)"/)?.[1] ?? "";
      const externalUrl = htmlUnescape(block.match(/<a href="([^"]+)">\[link\]<\/a>/i)?.[1] ?? "");
      const url = externalUrl || commentsUrl;
      const date = block.match(/<updated>(.*?)<\/updated>/)?.[1];
      if (!postId || !url) continue;
      posts.push({
        id: `reddit-${postId}`,
        source: "reddit",
        title,
        url,
        score: 0,
        comments: 0,
        category: categorize(title),
        timestamp: date ?? new Date().toISOString(),
      });
    }
    return posts;
  } catch {
    return [];
  }
}

export async function fetchDevCommunity(): Promise<TrendItem[]> {
  try {
    const res = await fetch("https://dev.to/api/articles?per_page=30&sort_by=hot", {
      headers: { "User-Agent": "TechPulseDashboard/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const articles = await res.json();
    return (Array.isArray(articles) ? articles : []).map(
      (article: {
        id?: string | number;
        title?: string;
        url?: string;
        positive_reactions_count?: number;
        comments_count?: number;
        published_at?: string;
        tag_list?: string[];
      }) => {
        const title = article.title ?? "";
        const tags = article.tag_list ?? [];
        return {
          id: `dev-${article.id ?? ""}`,
          source: "dev_community" as const,
          title,
          url: article.url ?? "",
          score: article.positive_reactions_count ?? 0,
          comments: article.comments_count ?? 0,
          category: categorize(`${title} ${tags.join(" ")}`),
          timestamp: article.published_at ?? new Date().toISOString(),
        };
      },
    );
  } catch {
    return [];
  }
}
