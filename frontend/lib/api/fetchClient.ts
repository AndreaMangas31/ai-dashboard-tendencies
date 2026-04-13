/**
 * Cliente HTTP centralizado con soporte para múltiples tipos de contenido
 */

export enum ContentType {
  JSON = "application/json",
  SSE = "text/event-stream",
}

/**
 * Fetch genérico para respuestas JSON
 * @template T - Tipo de la respuesta esperada
 */
export async function fetchJSON<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": ContentType.JSON,
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch para streaming SSE (Server-Sent Events)
 * Retorna un AsyncGenerator que emite texto en chunks
 */
export async function* fetchSSE(
  url: string,
  options?: RequestInit,
): AsyncGenerator<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": ContentType.SSE,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data) {
            yield data;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error streaming from", url, error);
    throw error;
  }
}
