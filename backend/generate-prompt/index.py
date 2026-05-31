import os
import json
import re
import urllib.request
from groq import Groq


def fetch_url_metadata(url: str) -> dict:
    """Извлекает метаданные страницы по URL (title, og:description и др.)."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; SunoEngineerBot/1.0)'}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read(80000).decode('utf-8', errors='ignore')

        def extract(pattern, text):
            m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else ''

        title = extract(r'<title[^>]*>(.*?)</title>', html)
        og_title = extract(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
        og_desc = extract(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']', html)
        meta_desc = extract(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html)
        genre = extract(r'<meta[^>]+name=["\']music:genre["\'][^>]+content=["\']([^"\']+)["\']', html)

        return {
            'title': og_title or title or '',
            'description': og_desc or meta_desc or '',
            'genre': genre or '',
        }
    except Exception as e:
        return {'title': '', 'description': '', 'genre': '', 'fetch_error': str(e)}


def detect_source(url: str) -> str:
    url_lower = url.lower()
    if 'suno.com' in url_lower or 'suno.ai' in url_lower:
        return 'Suno AI'
    elif 'youtube.com' in url_lower or 'youtu.be' in url_lower:
        return 'YouTube'
    elif 'soundcloud.com' in url_lower:
        return 'SoundCloud'
    elif 'spotify.com' in url_lower:
        return 'Spotify'
    elif 'bandcamp.com' in url_lower:
        return 'Bandcamp'
    return 'Web'


def handler(event: dict, context) -> dict:
    """
    Принимает URL трека-референса, парсит метаданные страницы и через Groq (llama-3.3-70b)
    генерирует три готовых блока для Suno AI: style, structure, engineering_notes.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    track_url = body.get('url', '').strip()
    extra_notes = body.get('notes', '').strip()

    if not track_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': {'error': 'URL трека не может быть пустым'}
        }

    if not re.match(r'https?://', track_url, re.IGNORECASE):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': {'error': 'Введите корректный URL (начинается с http:// или https://)'}
        }

    source = detect_source(track_url)
    meta = fetch_url_metadata(track_url)

    context_parts = [
        f"Источник: {source}",
        f"URL: {track_url}",
    ]
    if meta.get('title'):
        context_parts.append(f"Название трека: {meta['title']}")
    if meta.get('description'):
        context_parts.append(f"Описание страницы: {meta['description'][:800]}")
    if meta.get('genre'):
        context_parts.append(f"Жанр: {meta['genre']}")
    if extra_notes:
        context_parts.append(f"Заметки пользователя: {extra_notes}")

    track_context = '\n'.join(context_parts)

    client = Groq(api_key=os.environ['GROQ_API_KEY'])

    system_prompt = """Ты — Suno Reverse Engineer Pro, экспертный AI-звукорежиссёр и специалист по промт-инжинирингу для Suno AI.

Твоя задача: по метаданным трека-референса провести реверс-инжиниринг и создать промты для воссоздания похожего трека в Suno AI.

ПРАВИЛА Style Prompt:
- Строго до 120 символов, только английские теги через запятую
- Порядок: жанр → темп → инструменты → вокал → пространство → динамика
- Тяжёлый мастеринг → "punchy dense mix" | длинный реверб → "stadium reverb" | дисторшн вокала → "raw distorted vocals"

ПРАВИЛА Lyrics Structure:
- Квадратные скобки для секций: [Verse 1], [Chorus], [Bridge], [Outro]
- Технические теги внутри секций: [Heavy Drums], [Vocal Chop], [Build-up], [Fade Out]
- Место для текста: (текст куплета), (текст припева)

Ответь СТРОГО в формате JSON:
{
  "style_prompt": "теги через запятую, до 120 символов",
  "lyrics_structure": "структура с мета-тегами и местами для текста",
  "engineering_notes": "2-3 предложения о ключевых приёмах референса и как они закодированы в тегах"
}"""

    user_message = f"""Проведи реверс-инжиниринг этого трека и создай промты для Suno AI:

{track_context}

Если метаданных мало — используй всё доступное (название, платформу, описание) для определения жанра, энергетики и стиля."""

    response = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message},
        ],
        temperature=0.7,
        max_tokens=1500,
        response_format={'type': 'json_object'}
    )

    result = json.loads(response.choices[0].message.content)

    style = result.get('style_prompt', '')
    if len(style) > 120:
        style = style[:117] + '...'

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': {
            'style': style,
            'structure': result.get('lyrics_structure', ''),
            'notes': result.get('engineering_notes', ''),
            'meta': {
                'title': meta.get('title', ''),
                'source': source,
                'url': track_url,
            }
        }
    }