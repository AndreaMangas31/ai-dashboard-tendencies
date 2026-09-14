import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Category = "ai" | "web" | "tools" | "other";

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

function categorize(text: string): Category {
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

async function fetchHackerNews(): Promise<TrendItem[]> {
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

async function fetchReddit(): Promise<TrendItem[]> {
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

async function fetchDevCommunity(): Promise<TrendItem[]> {
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

async function fetchProductHunt(): Promise<TrendItem[]> {
  const apiKey = process.env.PRODUCT_HUNT_API_KEY;
  if (!apiKey) {
    return fetchProductHuntRss();
  }
  try {
    const query = `{
      productsConnection(first: 20, order: TRENDING) {
        edges {
          node {
            id
            name
            tagline
            url
            votesCount
            commentsCount
            createdAt
            topics(first: 5) { edges { node { name } } }
          }
        }
      }
    }`;
    const res = await fetch("https://api.producthunt.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 300 },
    });
    const data = await res.json();
    if (data.errors) {
      return fetchProductHuntRss();
    }
    const products: TrendItem[] = [];
    for (const edge of data?.data?.productsConnection?.edges ?? []) {
      const product = edge.node ?? {};
      const topics = (product.topics?.edges ?? []).map((t: { node?: { name?: string } }) => t.node?.name ?? "");
      const title = product.tagline ? `${product.name}: ${product.tagline}` : product.name ?? "";
      products.push({
        id: `ph-${product.id}`,
        source: "producthunt",
        title,
        url: product.url ?? "",
        score: product.votesCount ?? 0,
        comments: product.commentsCount ?? 0,
        category: categorize(`${title} ${topics.join(" ")}`),
        timestamp: product.createdAt ?? new Date().toISOString(),
      });
    }
    return products;
  } catch {
    return fetchProductHuntRss();
  }
}

async function fetchProductHuntRss(): Promise<TrendItem[]> {
  try {
    const res = await fetch("https://www.producthunt.com/feed", {
      headers: { "User-Agent": "TechPulseDashboard/1.0" },
      next: { revalidate: 300 },
    });
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
    return items.map((match, index) => {
      const block = match[1];
      const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1] ?? "Product Hunt item";
      const url = (block.match(/<link>(.*?)<\/link>/))?.[1] ?? "https://www.producthunt.com";
      const date = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1];
      return {
        id: `ph-rss-${index}-${encodeURIComponent(title).slice(0, 24)}`,
        source: "producthunt" as const,
        title,
        url,
        score: 20 - index,
        comments: 0,
        category: categorize(title),
        timestamp: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const [hackernews, reddit, devCommunity] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchDevCommunity(),
  ]);
  const items = [...hackernews, ...reddit, ...devCommunity].sort((a, b) => b.score - a.score);
  return NextResponse.json({
    items: items.slice(0, 100),
    fetched_at: new Date().toISOString(),
  });
}
