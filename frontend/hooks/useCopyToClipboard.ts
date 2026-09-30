import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(resetAfterMs = 2000) {
  const [copied, setCopied] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
      } catch (error) {
        console.error("Failed to copy:", error);
      }
    },
    [resetAfterMs],
  );

  return { copied, copy };
}
