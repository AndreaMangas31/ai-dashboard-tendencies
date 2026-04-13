# Tech Pulse Dashboard

A real-time dashboard aggregating trending content from Hacker News, Reddit (r/programming, r/technology), and Product Hunt with AI-powered briefing using Groq.

![Tech Pulse](https://img.shields.io/badge/Next.js%2014-black?logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-009687?logo=fastapi) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css) ![Groq AI](https://img.shields.io/badge/Groq%20AI-orange)

## Features

✨ **Real-time trending aggregation** from 3 major tech sources
🤖 **AI-powered briefing** using Groq's Llama 3.3-70B model with streaming
📊 **Smart categorization** - AI, Web, Tools, Other
🎨 **Dark theme dashboard** with responsive 3-column layout
⚡ **Auto-refresh** every 5 minutes with manual refresh option
📱 **Fully responsive** - desktop, tablet, mobile
🔄 **Streaming SSE** for real-time briefing generation

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, Python 3.9+ |
| **AI** | Groq (llama-3.3-70b-versatile, free tier) |
| **APIs** | Hacker News (public), Reddit (public JSON), Product Hunt (GraphQL) |

## Project Structure

```
ai-dashboard-tendencies/
├── frontend/                    # Next.js application
│   ├── app/
│   │   ├── page.tsx            # Main dashboard (3-column layout)
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── TrendCard.tsx       # Individual trend item
│   │   ├── SourceColumn.tsx    # Column container per source
│   │   ├── BriefingPanel.tsx   # Sliding AI briefing panel
│   │   └── RefreshBar.tsx      # Refresh control + countdown
│   ├── lib/
│   │   └── api.ts              # Backend API communication
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── next.config.js
│
├── backend/                     # FastAPI application
│   ├── main.py                 # Routes & CORS config
│   ├── briefing.py             # Groq streaming logic
│   ├── scrapers/
│   │   ├── hackernews.py      # HN scraper with categorization
│   │   ├── reddit.py          # Reddit scraper with categorization
│   │   └── producthunt.py     # Product Hunt GraphQL scraper
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                   # ← Add your API keys here
│
├── .gitignore
└── README.md
```

## Setup Instructions

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **Groq API Key** (free at https://console.groq.com)
- **Product Hunt API Key** (optional, get at https://www.producthunt.com/docs)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

**Configure `.env`** with your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
PRODUCT_HUNT_API_KEY=your_product_hunt_key_here  # Optional
```

Get your free Groq API key:
1. Go to https://console.groq.com
2. Sign up or log in
3. Copy your API key
4. Paste into `.env`

**Run the backend:**
```bash
python main.py
```

The API will be available at `http://localhost:8000`. Check health: `curl http://localhost:8000/health`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (if using different backend URL)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

## API Endpoints

### `GET /api/trends`

Returns aggregated trending items from all sources.

**Response:**
```json
{
  "items": [
    {
      "id": "hn-12345",
      "source": "hackernews",
      "title": "Trend title",
      "url": "https://...",
      "score": 1234,
      "comments": 456,
      "category": "ai",
      "timestamp": "2024-04-13T10:30:00Z"
    }
  ],
  "fetched_at": "2024-04-13T10:35:00Z"
}
```

### `GET /api/briefing` (SSE)

Streams AI-generated executive briefing as Server-Sent Events.

Each event contains a `data:` chunk of the briefing text. The frontend collects these chunks to display streaming content.

**Example event stream:**
```
data: You are a senior tech analyst.
data:  Based on these trending topics
data: ...
```

### `GET /health`

Simple health check endpoint.

## Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GROQ_API_KEY` | Groq API key for AI briefing | Yes |
| `PRODUCT_HUNT_API_KEY` | Product Hunt GraphQL key | No* |

\* *If missing, Product Hunt section will be empty but dashboard continues working*

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## Running in Production

### Backend
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
npm run start
```

Update `NEXT_PUBLIC_API_URL` to your backend domain.

## Architecture Details

### Data Flow

1. **Frontend** requests trends from FastAPI
2. **Backend** concurrently fetches from 3 sources
3. **Results** are aggregated, sorted by score, categorized
4. **Frontend** displays in 3 columns, supports filtering by category
5. **On briefing request**, backend fetches top 30 trends, sends to Groq
6. **Groq streams** response back as SSE
7. **Frontend** renders streaming text token-by-token

### Categorization Logic

Auto-categories are inferred from title + URL/topics:
- **AI**: "ai", "llm", "gpt", "claude", "transformer", "machine learning"
- **Web**: "javascript", "react", "typescript", "nextjs", "frontend"
- **Tools**: "tool", "cli", "library", "framework", "open source"
- **Other**: everything else

### Error Handling

- ✅ If one data source fails, others continue loading
- ✅ If Groq is unavailable, briefing shows error message
- ✅ Network errors are caught and user-friendly messages shown
- ✅ Missing Product Hunt key gracefully skips that source

## Performance

- **Initial load**: ~2-3s (concurrent requests)
- **Auto-refresh**: Every 5 minutes (configurable in `page.tsx`)
- **Briefing generation**: 5-15s depending on Groq queue
- **Responsive**: Optimized for 3-column desktop, stacked mobile

## Styling

- **Dark theme** with slate, navy, blue palette
- **Color coding**: HN (orange), Reddit (red), Product Hunt (purple)
- **Smooth animations**: Card reveal, panel slide-in, smooth transitions
- **Tailwind CSS**: Utility-first approach, no external UI libraries
- **Fully responsive**: Mobile-first design

## Development

### Adding a new data source

1. **Create scraper** in `backend/scrapers/newsource.py`
   ```python
   async def fetch_newsource_trends() -> list[dict]:
       # Return list of trend dicts with schema below
       return [{
           "id": "unique-id",
           "source": "newsource",
           "title": "...",
           "url": "...",
           "score": 100,
           "comments": 50,
           "category": "ai",
           "timestamp": "2024-04-13T10:00:00Z"
       }]
   ```

2. **Add to main.py**
   ```python
   from scrapers.newsource import fetch_newsource_trends
   
   in get_trends():
       newsource_items = await fetch_newsource_trends()
   ```

3. **Update frontend** `SourceColumn.tsx` with icon/color

### Common customizations

**Change refresh interval** (`frontend/app/page.tsx`):
```tsx
const interval = setInterval(() => {
  loadTrends();
}, 10 * 60 * 1000); // 10 minutes instead of 5
```

**Change Groq model** (`backend/briefing.py`):
```python
client.messages.stream(
    model="mixtral-8x7b-32768",  # Alternative Groq model
    ...
)
```

## Groq Free Tier Limits

- ✅ 25 requests/day
- ✅ No credit card required
- ✅ Rate limit: ~10 requests/minute
- ✅ Available models: Llama 3.x, Mixtral, Gemma

For higher usage, upgrade to Groq Pro: https://console.groq.com/keys

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000
# Kill if needed: kill -9 <PID>

# Verify Python version
python --version  # Should be 3.9+
```

### Frontend shows "API connection failed"
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check CORS - should return {"status": "ok"}
# If CORS error, backend might not be running
```

### Groq API returns 429 (rate limit)
```
- Wait 60 seconds
- You've hit the free tier rate limit
- Consider upgrading plan or adding delays between requests
```

### Empty Product Hunt section
```
- Product Hunt API key is optional
- Only missing if you haven't set PRODUCT_HUNT_API_KEY
- Dashboard continues working without it
```

## API Documentation

Full API docs available at `http://localhost:8000/docs` (auto-generated by FastAPI)

## License

MIT

## Credits

- Data from [Hacker News](https://news.ycombinator.com), [Reddit](https://reddit.com), [Product Hunt](https://producthunt.com)
- AI powered by [Groq](https://groq.com)
- Built with [Next.js](https://nextjs.org), [FastAPI](https://fastapi.tiangolo.com), [Tailwind CSS](https://tailwindcss.com)

---

**Questions?** Open an issue or check the troubleshooting section above.
