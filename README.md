# IntelliTrends

Dashboard de tendencias tecnológicas que reúne lo más visto en Hacker News, Reddit y DEV Community, y genera un briefing ejecutivo con IA.

Despliegue: [tech-pulse-livid.vercel.app](https://tech-pulse-livid.vercel.app)

## Qué hace

- Muestra las tendencias en un layout de tres columnas (Hacker News, Reddit y DEV Community).
- Filtra por categoría: AI, Web, Tools u Other, inferida del título y de las etiquetas o la URL.
- Actualiza los datos al cargar, al pulsar Refresh y automáticamente cada 5 minutos.
- El botón **Generate Brief** abre un panel con un resumen generado por Groq (`openai/gpt-oss-20b`). Si no hay clave o falla el modelo, el front muestra un fallback con los titulares del día.
- Permite copiar el briefing. Si Reddit limita el ritmo de peticiones, la columna puede mostrar una copia en caché o un aviso de estado.

Las fuentes actuales son Hacker News (Algolia), los feeds Atom de `r/programming` y `r/technology`, y la API pública de DEV Community (`dev.to`). En `backend/scrapers/producthunt.py` queda un scraper de Product Hunt que **ya no está cableado** en el servicio de tendencias ni en el front.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 14.0.4 (App Router), React 18, TypeScript, Tailwind CSS 3.3, Font Awesome |
| Backend | FastAPI 0.104.1, Uvicorn 0.24.0, httpx, Pydantic 2, python-dotenv |
| IA | Groq (`groq` 1.0.0 en Python; el route de Next también llama a la API de Groq) |
| Deploy | Vercel (`vercel.json` en la raíz: servicio `frontend` + servicio `backend`) |

El `package.json` del front se llama `tech-pulse-dashboard`. El API de FastAPI se titula `IntelliTrends API`.

## Cómo ejecutarlo en local

Necesitas Node.js y Python 3. El front puede servir `/api/trends` y `/api/briefing` por sí mismo; `NEXT_PUBLIC_API_URL` solo hace falta si quieres apuntar a FastAPI (por defecto queda vacío y las peticiones van a las rutas de Next).

### Frontend

```bash
cd frontend
npm install
# Opcional, si usas el backend en :8000:
# echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Queda en [http://localhost:3000](http://localhost:3000).

Otros scripts: `npm run build`, `npm run start`, `npm run lint`.

### Backend (opcional)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
# o: uvicorn main:app --reload
```

El API queda en `http://127.0.0.1:8000` (`GET /health`, `GET /api/trends`, `GET /api/briefing`). La documentación automática de FastAPI está en `/docs`.

### Variables de entorno

Solo los nombres; los valores van en tu `.env` / `.env.local` o en los secrets de Vercel, nunca en el repo.

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `GROQ_API_KEY` | backend `.env` y/o el entorno del front en Vercel | Briefing con Groq. Sin ella, el route de Next usa el fallback de titulares. |
| `PRODUCT_HUNT_API_KEY` | aparece en `backend/.env.example` | Pensada para el scraper de Product Hunt, que hoy no se usa. |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | Base del API. Si falta, el front llama a `/api/...` en el mismo origen. |

## Estructura

```
ai-dashboard-tendencies/
├── frontend/                 # Next.js
│   ├── app/                  # páginas, layout y routes /api/trends y /api/briefing
│   ├── components/           # cards, columnas, filtro, panel de briefing
│   ├── hooks/                # useFetchTrends, useStreamBriefing, useCopyToClipboard
│   └── lib/api/              # cliente y fetchers de cada fuente
├── backend/                  # FastAPI
│   ├── main.py               # app y CORS
│   ├── routes.py
│   ├── controllers/          # trends y briefing
│   ├── services/             # agregación de fuentes y llamada a Groq
│   ├── scrapers/             # hackernews, reddit, dev_community (y producthunt, sin usar)
│   └── requirements.txt
└── vercel.json
```

## Estado

Proyecto personal desplegado en Vercel. El README anterior describía Product Hunt y el modelo Llama 3.3-70B; el código actual usa DEV Community y `openai/gpt-oss-20b` a través de Groq.
