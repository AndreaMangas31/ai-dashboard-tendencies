/**
 * Centralizado de rutas API
 * Define todos los endpoints disponibles del backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ROUTES = {
  // Trends endpoints
  trends: {
    all: `${API_BASE_URL}/api/trends`,
    description: "GET - Obtiene trending items de todas las fuentes",
  },

  // Briefing endpoints
  briefing: {
    generate: `${API_BASE_URL}/api/briefing`,
    description: "GET (SSE) - Streamea briefing generado por IA",
  },

  // Health check
  health: {
    check: `${API_BASE_URL}/health`,
    description: "GET - Verifica estado del backend",
  },
} as const;

/**
 * Función auxiliar para construir URLs con parámetros
 */
export function buildApiUrl(
  route: keyof typeof API_ROUTES,
  params?: Record<string, string | number>,
): string {
  const routeObj = API_ROUTES[route] as Record<string, string>;
  const urlKey = Object.keys(routeObj).find(
    (key) => key !== "description",
  ) as string;
  let url = routeObj[urlKey];

  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce(
        (acc, [key, val]) => {
          acc[key] = String(val);
          return acc;
        },
        {} as Record<string, string>,
      ),
    ).toString();

    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Verificación de disponibilidad del API
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(API_ROUTES.health.check);
    return response.ok;
  } catch {
    return false;
  }
}
