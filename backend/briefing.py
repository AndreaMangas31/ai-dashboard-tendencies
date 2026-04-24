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

    prompt = f"""JSON ARRAY.

Structure:
- h1: "Tech Industry Briefing"
- h2: sectors (AI, Video Games, Economics, Infrastructure, etc.)
- Each sector: 1 short p + EXACTLY 2 li
- End with h2 "Where to Invest" + 1 p

Topics: {topics_text}

FORMAT EXAMPLE (JSON):
[
{{"type":"h1","content":"Tech Industry Briefing","className":"text-lg font-bold"}},
{{"type":"h2","content":"AI & Machine Learning","className":"text-base font-bold"}},
{{"type":"p","content":"Key AI developments.","className":"text-sm"}},
{{"type":"li","content":"OpenAI launches GPT-5","className":"text-sm"}},
{{"type":"li","content":"DeepMind improves AlphaFold","className":"text-sm"}},
{{"type":"h2","content":"Where to Invest","className":"text-base font-bold"}},
{{"type":"p","content":"Focus on AI and semiconductors","className":"text-sm"}}
]

FORMAT EXAMPLE (.toon reference):
[h1] Tech Industry Briefing
[h2] AI & Machine Learning
[p] Key AI developments.
[li] OpenAI launches GPT-5
[li] DeepMind improves AlphaFold
[h2] Where to Invest
[p] Focus on AI and semiconductors

IMPORTANT RULES:
- RESPOND ONLY WITH VALID JSON ARRAY
- Keep content SHORT and concise
- Max 12-14 words per li
- Max 20 words per p
- ALWAYS 2 li per sector (no more, no less)
- Only include relevant sectors
- Mention specific companies/projects when possible

- Output must ALWAYS be a complete and valid JSON array
- NEVER cut off mid-object or mid-array
- Ensure all brackets and objects are properly closed
- If response is too long, reduce number of sectors or text length
- Priority: valid JSON over completeness of content
- It is better to return fewer sectors than broken JSON

- NO markdown, NO explanations
- NO text before/after JSON

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
            max_tokens=512,
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
