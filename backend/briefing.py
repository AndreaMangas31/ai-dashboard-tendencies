import os
import json
import re
from typing import Generator, List
from dotenv import load_dotenv
from groq import Groq

# Cargar variables de entorno
load_dotenv()

def clean_truncated_json(json_str: str) -> str:
    """Limpiar JSON truncado encontrando el último objeto completo."""
    print(f"[DEBUG CLEAN] Input: {len(json_str)} bytes")
    
    try:
        json.loads(json_str)
        print(f"[DEBUG CLEAN] JSON válido")
        return json_str
    except json.JSONDecodeError:
        print(f"[DEBUG CLEAN] JSON truncado, limpiando...")

    # Buscar el último } válido
    last_close = json_str.rfind("}")
    if last_close == -1:
        return "[]"

    # Contar braces desde el final towards atrás
    brace_count = 0
    last_object_end = -1
    
    for i in range(len(json_str) - 1, -1, -1):
        if json_str[i] == "}":
            brace_count += 1
            if brace_count == 1:
                last_object_end = i
        elif json_str[i] == "{":
            brace_count -= 1
            if brace_count == 0:
                # Objeto completo encontrado
                cleaned = json_str[:last_object_end + 1] + "]"
                try:
                    json.loads(cleaned)
                    print(f"[DEBUG CLEAN] Limpio exitoso: {len(cleaned)} bytes")
                    return cleaned
                except:
                    brace_count = 0

    print(f"[DEBUG CLEAN] No se pudo limpiar")
    return "[]"

# This stream generates an AI briefing based on the trending topics using Groq's LLM. It accumulates the full JSON, cleans it if truncated, and yields valid JSON to the frontend.
def stream_briefing(topics: List[str]) -> Generator[str, None, None]:
    """Stream an AI-generated briefing about tech trends using Groq."""
    api_key = os.environ.get("GROQ_API_KEY", "")

    if not api_key:
        yield "Error: GROQ_API_KEY not configured\n"
        return

    client = Groq(api_key=api_key)

    topics_text = "\n".join([f"- {topic}" for topic in topics[:30]])

    prompt = f"""JSON ARRAY. h1 "Tech Industry Briefing", h2 sectors (AI, Video Games, Economics, Infrastructure), each: p + 2 li, end "Where to Invest".

Topics: {topics_text}

[{{"type":"h1","content":"Tech Industry Briefing","className":"text-lg font-bold text-slate-100 font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"}},
{{"type":"h2","content":"AI & Machine Learning","className":"text-base font-bold text-slate-100 mt-2 mb-1"}},
{{"type":"p","content":"Latest AI breakthroughs and deployments.","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"OpenAI releases GPT-5 with advanced reasoning","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"DeepMind's AlphaFold 3 discovers new protein structures","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Meta's Llama 3 becomes industry standard","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Google announces autonomous AI agents for coding","className":"text-slate-300 text-sm text-justify"}},
{{"type":"h2","content":"Video Games","className":"text-base font-bold text-slate-100 mt-2 mb-1"}},
{{"type":"p","content":"Major gaming announcements and industry trends.","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Unreal Engine 6 released with powerful new features","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"PlayStation 6 development nears completion","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"AI now mainstream in AAA game development","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"New esports tournament with $50M prize pool announced","className":"text-slate-300 text-sm text-justify"}},
{{"type":"h2","content":"Economics & Markets","className":"text-base font-bold text-slate-100 mt-2 mb-1"}},
{{"type":"p","content":"Tech stocks and market movements.","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Tech stocks surge on AI profitability reports","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Venture funding for AI reaches record highs","className":"text-slate-300 text-sm text-justify"}},
{{"type":"li","content":"Bitcoin stabilizes with institutional adoption","className":"text-slate-300 text-sm text-justify"}},
{{"type":"h2","content":"Where to Invest","className":"text-base font-bold text-slate-100 mt-2 mb-1"}},
{{"type":"p","content":"Based on the above trends, the most promising sectors for investment in the next 6-12 months are AI infrastructure, semiconductor manufacturers, and gaming technology companies.","className":"text-slate-300 text-sm text-justify"}}
]

IMPORTANT RULES:
- RESPOND ONLY WITH VALID JSON ARRAY
- Always start with h1 "Tech Industry Briefing"
- Organize content BY SECTORS (AI, Video Games, Economics, Infrastructure, Web Tools, Corporate Markets, etc.)
- Use h2 for sector headers
- EACH SECTOR MUST HAVE 3-4 li elements (news points minimum)
- Only include sectors with relevant trends in the topics
- NO markdown, NO hashes, NO explanations
- NO text before/after the JSON
- End with "Where to Invest" sector with recommendations
- Mention specific company/project names
- Make content informative and detailed

GENERATE NOW:"""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=1,
            max_tokens=2048,
            top_p=1,
            stream=True,
            stop=None,
        )

        # Acumular todos los chunks en un buffer
        json_buffer = ""
        chunk_count = 0
        for chunk in completion:
            content = chunk.choices[0].delta.content
            if content:
                json_buffer += content
                chunk_count += 1

        print(f"[BACKEND] Chunks: {chunk_count}, Size: {len(json_buffer)}")
        print(f"[BACKEND] First 150: {json_buffer[:150]}")
        print(f"[BACKEND] Last 150: {json_buffer[-150:]}")

        # Limpiar JSON truncado si es necesario
        cleaned_json = clean_truncated_json(json_buffer)
        
        # Validar que el JSON resultante es válido
        try:
            parsed = json.loads(cleaned_json)
            print(f"[BACKEND] ✓ JSON válido! Elementos: {len(parsed)}")
        except json.JSONDecodeError as e:
            print(f"[BACKEND] ✗ JSON inválido: {str(e)}")
            cleaned_json = "[]"

        # Devolver el JSON completo de una sola vez
        yield cleaned_json

    except Exception as e:
        yield f"Error generating briefing: {str(e)}\n"
