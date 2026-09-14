import {
  fetchDevCommunity,
  fetchHackerNews,
  fetchReddit,
} from "@/lib/api/fetchTrendSources";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type BriefingElement = { type: string; content: string; className: string };

function classFor(type: string): string {
  if (type === "h1") return "text-lg font-bold";
  if (type === "h2") return "text-base font-bold";
  return "text-sm";
}

function sseResponse(payload: unknown) {
  return new Response(`data: ${JSON.stringify(payload)}\n\n`, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function fallbackBriefing(topics: string[]): BriefingElement[] {
  return [
    { type: "h1", content: "Tech Industry Briefing", className: classFor("h1") },
    { type: "h2", content: "Today's headlines", className: classFor("h2") },
    {
      type: "p",
      content:
        "Roundup of stories trending on Hacker News, Reddit, and DEV Community.",
      className: classFor("p"),
    },
    ...topics.slice(0, 8).map((title) => ({
      type: "li",
      content: title,
      className: classFor("li"),
    })),
    { type: "h2", content: "Where to Invest", className: classFor("h2") },
    {
      type: "p",
      content:
        "Watch AI infrastructure, developer tools, and platforms appearing across today's feeds.",
      className: classFor("p"),
    },
  ];
}

function extractElements(raw: string): BriefingElement[] | null {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const tryParse = (value: string): BriefingElement[] | null => {
    try {
      const parsed = JSON.parse(value);
      const list = Array.isArray(parsed) ? parsed : parsed?.elements;
      if (!Array.isArray(list) || !list.length) return null;
      return list
        .filter((item) => item && typeof item.content === "string")
        .map((item) => ({
          type: item.type || "p",
          content: item.content,
          className: item.className || classFor(item.type || "p"),
        }));
    } catch {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const sliced = tryParse(trimmed.slice(start, end + 1));
    if (sliced) return sliced;
  }

  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i] !== "}") continue;
    const repaired = tryParse(`${trimmed.slice(trimmed.indexOf("["), i + 1)}]`);
    if (repaired) return repaired;
  }
  return null;
}

function messageText(message: { content?: unknown; reasoning?: string }): string {
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          const record = part as { text?: string; content?: string };
          return record.text || record.content || "";
        }
        return "";
      })
      .join("");
  }
  return message.reasoning || "";
}

async function generateWithGroq(
  apiKey: string,
  topics: string[],
): Promise<BriefingElement[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "Reply with a JSON array only. No markdown.",
          },
          {
            role: "user",
            content: `Brief these topics as a JSON array of {type, content, className}.
Use h1, h2, p, li. Start with h1 "Tech Industry Briefing". End with h2 "Where to Invest" and one p.
className: h1=text-lg font-bold, h2=text-base font-bold, else text-sm.

Topics:
${topics.map((topic) => `- ${topic}`).join("\n")}`,
          },
        ],
        temperature: 0.3,
        max_completion_tokens: 1200,
        stream: false,
        include_reasoning: false,
        reasoning_effort: "low",
      }),
    });
    if (!groqRes.ok) return null;
    const groqJson = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: unknown; reasoning?: string } }>;
    };
    return extractElements(messageText(groqJson.choices?.[0]?.message ?? {}));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const [hackernews, reddit, devCommunity] = await Promise.all([
    fetchHackerNews(),
    fetchReddit(),
    fetchDevCommunity(),
  ]);
  const topics = [...hackernews, ...reddit, ...devCommunity]
    .sort((a, b) => b.score - a.score)
    .map((item) => item.title)
    .filter(Boolean)
    .slice(0, 16);

  if (!topics.length) {
    return sseResponse([
      { type: "h2", content: "Briefing error", className: classFor("h2") },
      {
        type: "p",
        content: "No trending topics available to brief.",
        className: classFor("p"),
      },
    ]);
  }

  const apiKey = process.env.GROQ_API_KEY;
  const generated = apiKey ? await generateWithGroq(apiKey, topics) : null;
  return sseResponse(generated?.length ? generated : fallbackBriefing(topics));
}
