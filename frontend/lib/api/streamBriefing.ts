import { API_ROUTES } from "@/lib/apiRoutes";
import { fetchSSE } from "./fetchClient";

/**
 * Stream AI-generado briefing content
 * @yields Texto en chunks desde la respuesta streaming
 */
export function streamBriefing(): AsyncGenerator<string> {
  return fetchSSE(API_ROUTES.briefing.generate);
}
