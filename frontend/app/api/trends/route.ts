import { NextResponse } from "next/server";

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

async function fetchHackerNews(): Promise<TrendItem[]> {
  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      next: { revalidate: 300 },
    });
    const ids: number[] = (await idsRes.json()).slice(0, 20);
    const stories = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          next: { revalidate: 300 },
        });
        return res.json();
      }),
    );
    return stories.filter(Boolean).map((story) => ({
      id: `hn-${story.id}`,
      source: "hackernews",
      title: story.title ?? "",
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      score: story.score ?? 0,
      comments: story.descendants ?? 0,
      category: categorize(`${story.title ?? ""} ${story.url ?? ""}`),
      timestamp: new Date((story.time ?? 0) * 1000).toISOString(),
    }));
  } catch {
    return [];
  }
}

async function fetchReddit(): Promise<TrendItem[]> {
  const posts: TrendItem[] = [];
  for (const subreddit of ["programming", "technology"]) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, {
        headers: { "User-Agent": "TechPulseDashboard/1.0" },
        next: { revalidate: 300 },
      });
      const data = await res.json();
      for (const item of data?.data?.children ?? []) {
        const post = item.data;
        if (post?.stickied || post?.is_self) continue;
        posts.push({
          id: `reddit-${post.id}`,
          source: "reddit",
          title: post.title ?? "",
          url: post.url ?? "",
          score: post.score ?? 0,
          comments: post.num_comments ?? 0,
          category: categorize(post.title ?? ""),
          timestamp: new Date((post.created_utc ?? 0) * 1000).toISOString(),
        });
      }
    } catch {
      continue;
    }
  }
  return posts;
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
  const [hackernews, reddit, producthunt] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchProductHunt(),
  ]);
  const items = [...hackernews, ...reddit, ...producthunt].sort((a, b) => b.score - a.score);
  return NextResponse.json({
    items: items.slice(0, 100),
    fetched_at: new Date().toISOString(),
  });
}
