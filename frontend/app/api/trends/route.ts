import { NextResponse } from "next/server";
import {
  fetchDevCommunity,
  fetchHackerNews,
  fetchReddit,
} from "@/lib/api/fetchTrendSources";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
