export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TrendItem = { title?: string };

function sseResponse(payload: unknown) {
  const body = `data: ${JSON.stringify(payload)}\n\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}

function errorPayload(content: string) {
  return [
    {
      type: "h2",
      content: "Briefing error",
      className: "text-lg font-bold",
    },
    {
      type: "p",
      content,
      className: "text-sm",
    },
  ];
}

function extractJsonArray(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const tryParse = (value: string) => {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.elements)) return parsed.elements;
    throw new Error("JSON was not an array");
  };
  try {
    return tryParse(trimmed);
  } catch {
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return tryParse(trimmed.slice(arrayStart, arrayEnd + 1));
    }
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return tryParse(trimmed.slice(objectStart, objectEnd + 1));
    }
    throw new Error("Model did not return JSON");
  }
}

export async function GET(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return sseResponse(
      errorPayload(
        "GROQ_API_KEY is missing in this deployment. Add it in Vercel Project Settings → Environment Variables, then Redeploy.",
      ),
    );
  }

  try {
    const trendsUrl = new URL("/api/trends", request.url);
    const trendsRes = await fetch(trendsUrl, { cache: "no-store" });
    if (!trendsRes.ok) {
      return sseResponse(errorPayload("Could not load trending topics for the briefing."));
    }

    const trends = (await trendsRes.json()) as { items?: TrendItem[] };
    const topics = (trends.items ?? [])
      .map((item) => item.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 30);

    if (topics.length === 0) {
      return sseResponse(errorPayload("No trending topics available to brief."));
    }

    const topicsText = topics.map((topic) => `- ${topic}`).join("\n");
    const prompt = `Return ONLY a JSON object with key "elements" (an array).

Structure of elements:
- h1: "Tech Industry Briefing"
- h2: sectors (AI, Video Games, Economics, Infrastructure, etc.)
- Each sector: 1 descriptive p + EXACTLY 2 li
- End with h2 "Where to Invest" + 1 p

Topics:
${topicsText}

FORMAT:
{"elements":[{"type":"h1","content":"Tech Industry Briefing","className":"text-lg font-bold"},{"type":"h2","content":"AI & Machine Learning","className":"text-base font-bold"},{"type":"p","content":"AI is rapidly evolving with strong commercial adoption.","className":"text-sm"},{"type":"li","content":"OpenAI launches a new model improving reasoning","className":"text-sm"},{"type":"li","content":"DeepMind advances scientific discovery tools","className":"text-sm"},{"type":"h2","content":"Where to Invest","className":"text-base font-bold"},{"type":"p","content":"Focus on AI infrastructure and scalable software","className":"text-sm"}]}

RULES:
- Valid JSON object only
- Each p must give context
- ALWAYS 2 li per sector`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1800,
        stream: false,
        include_reasoning: false,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      return sseResponse(
        errorPayload(
          groqRes.status === 401
            ? "Groq rejected the API key. Check GROQ_API_KEY in Vercel and redeploy."
            : `Groq request failed (${groqRes.status}): ${detail.slice(0, 180)}`,
        ),
      );
    }

    const groqJson = (await groqRes.json()) as {
      choices?: Array<{ message?: { content?: string; reasoning?: string } }>;
    };
    const message = groqJson.choices?.[0]?.message ?? {};
    const content = `${message.content ?? ""}\n${message.reasoning ?? ""}`;
    const parsed = extractJsonArray(content);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return sseResponse(errorPayload("The briefing model returned empty content."));
    }

    return sseResponse(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown briefing error";
    return sseResponse(errorPayload(message));
  }
}
