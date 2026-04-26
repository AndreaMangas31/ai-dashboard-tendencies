export const SOURCE_BORDER_COLORS: Record<string, string> = {
  hackernews: "border-hn-orange/80",
  reddit: "border-reddit-red/80",
  producthunt: "border-ph-purple/80",
  dev_community: "border-black/80",
};

export const CATEGORY_COLORS: Record<string, string> = {
  ai: "bg-purple-700 text-white",
  web: "bg-blue-500 text-white",
  tools: "bg-orange-700 text-white",
  other: "bg-slate-700 text-white",
};

export const SOURCE_CLASS: Record<
  string,
  { icon: string; name: string; color: string; bgColor: string }
> = {
  hackernews: {
    icon: "/hacker_news_logo.webp",
    name: "Hacker News",
    color: "text-white",
    bgColor: "bg-hn-orange",
  },
  reddit: {
    icon: "/reddit_logo.webp",
    name: "Reddit",
    color: "text-white",
    bgColor: "bg-reddit-red/90",
  },
  producthunt: {
    icon: "/product_hunt_logo.png",
    name: "Product Hunt",
    color: "text-ph-purple",
    bgColor: "bg-gradient-to-b from-ph-purple to-purple-500/80",
  },
  dev_community: {
    icon: "/dev_community_logo.webp",
    name: "Dev Community",
    color: "text-dev-blue",
    bgColor: "bg-black",
  },
};
