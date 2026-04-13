import { useState, useCallback } from "react";
import { streamBriefing as apiStreamBriefing } from "@/lib/api";
import { ParsedElement } from "@/lib/helpers/useMarkdownParser";

export interface UseStreamBriefingReturn {
  elements: ParsedElement[];
  streaming: boolean;
  error: string | null;
  startStream: () => Promise<void>;
  reset: () => void;
}

function markdownToElements(markdown: string): ParsedElement[] {
  const lines = markdown.split("\n").filter((line) => line.trim());
  const elements: ParsedElement[] = [];

  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      elements.push({
        type: "h3",
        content: line.replace(/^###\s+/, ""),
        className: "text-base font-bold text-slate-100 mt-2 mb-1",
      });
    } else if (line.trim()) {
      elements.push({
        type: "p",
        content: line,
        className: "text-slate-300 text-sm mb-3",
      });
    }
  }

  return elements;
}

export function useStreamBriefing(): UseStreamBriefingReturn {
  const [elements, setElements] = useState<ParsedElement[]>([]);
  const [streaming, setStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startStream = useCallback(async () => {
    setStreaming(true);
    setElements([]);
    setError(null);

    let jsonBuffer = "";

    try {
      // Solo acumular, NO intentar parsear en cada chunk
      for await (const chunk of apiStreamBriefing()) {
        jsonBuffer += chunk;
      }

      console.log(`[FRONTEND] Total: ${jsonBuffer.length} bytes`);
      console.log(`[FRONTEND] First 100: ${jsonBuffer.substring(0, 100)}`);
      console.log(
        `[FRONTEND] Last 100: ${jsonBuffer.substring(Math.max(0, jsonBuffer.length - 100))}`,
      );

      // ÚNICO parseo: al final cuando todo está acumulado
      try {
        const parsed = JSON.parse(jsonBuffer) as ParsedElement[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[FRONTEND] ✓ JSON válido! ${parsed.length} elementos`);
          setElements(parsed);
        } else {
          throw new Error("Invalid JSON structure - empty or not array");
        }
      } catch (parseErr) {
        console.error(`[FRONTEND] ✗ JSON parse error:`, parseErr);
        console.error(`[FRONTEND] Buffer:`, jsonBuffer.substring(0, 300));

        // Fallback: si es markdown, convertir a elementos
        if (jsonBuffer.includes("###")) {
          console.warn("Received markdown, converting...");
          const markdownElements = markdownToElements(jsonBuffer);
          setElements(markdownElements);
        } else {
          setError("Failed to parse briefing format");
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      console.error("Error streaming briefing:", err);
    } finally {
      setStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setElements([]);
    setStreaming(false);
    setError(null);
  }, []);

  return { elements, streaming, error, startStream, reset };
}
