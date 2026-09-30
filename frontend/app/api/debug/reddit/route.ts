import { NextResponse } from "next/server";
import { REDDIT_FEED_URLS, REDDIT_HEADERS } from "@/lib/api/fetchTrendSources";

export const dynamic = "force-dynamic";

const USER_AGENTS = {
  app: REDDIT_HEADERS["User-Agent"],
  browser:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
};

async function probe(url: string, userAgent: string) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { ...REDDIT_HEADERS, "User-Agent": userAgent },
    });
    const body = await res.text();
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      rateLimitUsed: res.headers.get("x-ratelimit-used"),
      rateLimitRemaining: res.headers.get("x-ratelimit-remaining"),
      rateLimitReset: res.headers.get("x-ratelimit-reset"),
      hasEntries: body.includes("<entry"),
      bodyStart: body.slice(0, 300),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function GET() {
  const results = [];
  for (const url of REDDIT_FEED_URLS) {
    for (const [name, userAgent] of Object.entries(USER_AGENTS)) {
      results.push({ url, userAgent: name, ...(await probe(url, userAgent)) });
    }
  }
  return NextResponse.json({
    region: process.env.VERCEL_REGION ?? null,
    checkedAt: new Date().toISOString(),
    results,
  });
}
