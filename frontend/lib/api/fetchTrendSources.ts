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

const REDDIT_HEADERS = {
  "User-Agent": "TechPulseDashboard/1.0 (news-aggregator)",
  Accept: "application/atom+xml, application/rss+xml, application/xml, text/xml",
};

// El JSON de Reddit está bloqueado (403). El feed Atom sí funciona, pero ratea muy agresivo.
// %2B evita que el "+" del multi-reddit se interprete mal. Fallback: solo r/programming.
const REDDIT_FEED_URLS = [
  "https://www.reddit.com/r/programming%2Btechnology/.rss",
  "https://www.reddit.com/r/programming/.rss",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRedditXml(url: string): Promise<string | null> {
  const request = (cache: RequestCache | undefined, revalidate?: number) =>
    fetch(url, {
      headers: REDDIT_HEADERS,
      // 15 min de cache en 200 para no pegarle a Reddit en cada /api/trends.
      ...(cache ? { cache } : { next: { revalidate: revalidate ?? 900 } }),
    });

  let res = await request(undefined, 900);
  // 429 = cupo de Reddit agotado (~1 req). No cachear el fallo: reintento sin store.
  if (res.status === 429 || res.status === 503) {
    await sleep(2000);
    res = await request("no-store");
  }
  if (!res.ok) return null;
  const xml = await res.text();
  return xml.includes("<entry") ? xml : null;
}

function parseRedditAtom(xml: string): TrendItem[] {
  const posts: TrendItem[] = [];
  for (const match of [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 30)) {
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
      // El feed Atom no incluye votos ni comentarios.
      score: 0,
      comments: 0,
      category: categorize(title),
      timestamp: date ?? new Date().toISOString(),
    });
  }
  return posts;
}

export async function fetchReddit(): Promise<TrendItem[]> {
  try {
    for (const url of REDDIT_FEED_URLS) {
      const xml = await fetchRedditXml(url);
      if (!xml) continue;
      const posts = parseRedditAtom(xml);
      if (posts.length) return posts;
    }
    return [];
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
