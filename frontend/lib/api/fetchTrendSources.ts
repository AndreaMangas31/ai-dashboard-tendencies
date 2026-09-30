import { getCache } from "@vercel/functions";

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

// Medido desde Vercel (iad1): no hay bloqueo de IP, pero Reddit da ~1 petición por ventana
// por IP (x-ratelimit-remaining = 0 tras la primera) y las IPs de Vercel son compartidas.
// Por eso guardamos la última lista buena y solo volvemos a Reddit cuando está vieja.
const REDDIT_CACHE_KEY = "reddit:posts";
const REDDIT_FRESH_MS = 10 * 60 * 1000;
const REDDIT_KEEP_SECONDS = 24 * 60 * 60;
// Solo esperamos al reset si es corto; si no, servimos la copia vieja.
const REDDIT_MAX_RESET_WAIT_S = 8;

export type RedditStatus = "ok" | "stale" | "rate_limited" | "error";

interface RedditSnapshot {
  posts: TrendItem[];
  fetchedAt: number;
}

type RedditXmlResult = { xml: string } | { status: number };

let memorySnapshot: RedditSnapshot | null = null;
let inFlight: Promise<{ items: TrendItem[]; status: RedditStatus }> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readSnapshot(): Promise<RedditSnapshot | null> {
  try {
    const cached = (await getCache().get(REDDIT_CACHE_KEY)) as RedditSnapshot | null;
    if (cached?.posts?.length && (!memorySnapshot || cached.fetchedAt > memorySnapshot.fetchedAt)) {
      memorySnapshot = cached;
    }
  } catch (error) {
    console.warn("[reddit] runtime cache read failed", error);
  }
  return memorySnapshot;
}

async function writeSnapshot(posts: TrendItem[]) {
  memorySnapshot = { posts, fetchedAt: Date.now() };
  try {
    await getCache().set(REDDIT_CACHE_KEY, memorySnapshot, {
      ttl: REDDIT_KEEP_SECONDS,
      name: "reddit-posts",
    });
  } catch (error) {
    console.warn("[reddit] runtime cache write failed", error);
  }
}

async function fetchRedditXml(url: string): Promise<RedditXmlResult> {
  const request = () => fetch(url, { headers: REDDIT_HEADERS, cache: "no-store" });

  let res = await request();
  if (res.status === 429) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    if (Number.isFinite(reset) && reset <= REDDIT_MAX_RESET_WAIT_S) {
      await sleep(reset * 1000 + 500);
      res = await request();
    }
  }
  if (!res.ok) {
    console.warn(`[reddit] ${url} -> ${res.status} reset=${res.headers.get("x-ratelimit-reset")}`);
    return { status: res.status };
  }
  const xml = await res.text();
  if (!xml.includes("<entry")) {
    console.warn(`[reddit] ${url} -> ${res.status} without <entry>: ${xml.slice(0, 120)}`);
    return { status: res.status };
  }
  return { xml };
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

async function refreshReddit(): Promise<{ items: TrendItem[]; status: RedditStatus }> {
  const snapshot = await readSnapshot();
  if (snapshot && Date.now() - snapshot.fetchedAt < REDDIT_FRESH_MS) {
    return { items: snapshot.posts, status: "ok" };
  }

  let rateLimited = false;
  try {
    for (const url of REDDIT_FEED_URLS) {
      const result = await fetchRedditXml(url);
      if ("status" in result) {
        // Las dos URLs comparten cupo: tras un 429 probar la otra solo gasta otra petición.
        if (result.status === 429) {
          rateLimited = true;
          break;
        }
        continue;
      }
      const posts = parseRedditAtom(result.xml);
      if (posts.length) {
        await writeSnapshot(posts);
        return { items: posts, status: "ok" };
      }
    }
  } catch (error) {
    console.warn("[reddit] fetch failed", error);
  }

  if (snapshot) return { items: snapshot.posts, status: "stale" };
  return { items: [], status: rateLimited ? "rate_limited" : "error" };
}

// /api/trends y /api/briefing piden Reddit a la vez: compartimos la misma petición en curso.
export async function getRedditTrends(): Promise<{ items: TrendItem[]; status: RedditStatus }> {
  if (!inFlight) {
    inFlight = refreshReddit().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export async function fetchReddit(): Promise<TrendItem[]> {
  return (await getRedditTrends()).items;
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
