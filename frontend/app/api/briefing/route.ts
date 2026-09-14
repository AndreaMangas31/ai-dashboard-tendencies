export async function GET() {
  const encoder = new TextEncoder();
  const payload = JSON.stringify([
    {
      type: "h2",
      content: "Briefing on Vercel",
      className: "text-lg font-bold",
    },
    {
      type: "p",
      content:
        "Trends are live from Hacker News, Reddit, and Product Hunt. Add GROQ_API_KEY in Vercel to restore the original AI stream.",
    },
  ]);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
