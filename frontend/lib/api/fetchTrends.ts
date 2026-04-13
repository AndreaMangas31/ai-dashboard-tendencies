import { TrendsResponse } from "./types";
import { API_ROUTES } from "@/lib/apiRoutes";
import { fetchJSON } from "./fetchClient";

export async function fetchTrends(): Promise<TrendsResponse> {
  try {
    return await fetchJSON<TrendsResponse>(API_ROUTES.trends.all);
  } catch (error) {
    console.error("Error fetching trends:", error);
    return {
      items: [],
      fetched_at: new Date().toISOString(),
    };
  }
}
