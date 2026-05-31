import os
import json
import re
import urllib.request


def fetch_page_meta(url: str) -> dict:
    """Скачивает HTML страницы и извлекает og:title, og:description, title."""
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (compatible; SunoEngineerBot/1.0)'}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read(80000).decode('utf-8', errors='ignore')

        def get(pattern):
            m = re.search(pattern, html, re.IGNORECASE | re.DOTALL)
            return m.group(1).strip() if m else ''

        return {
            'title': get(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']') or get(r'<title[^>]*>(.*?)</title>'),
            'description': get(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']') or get(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']'),
            'genre': get(r'<meta[^>]+name=["\']music:genre["\'][^>]+content=["\']([^"\']+)["\']'),
        }
    except Exception as e:
        return {'title': '', 'description': '', 'genre': '', 'error': str(e)}


def get_source(url: str) -> str:
    u = url.lower()
    if 'suno.com' in u or 'suno.ai' in u: return 'Suno AI'
    if 'youtube.com' in u or 'youtu.be' in u: return 'YouTube'
    if 'soundcloud.com' in u: return 'SoundCloud'
    if 'spotify.com' in u: return 'Spotify'
    if 'bandcamp.com' in u: return 'Bandcamp'
    return 'Web'


def ask_ai(api_key: str, system_msg: str, user_msg: str) -> dict:
    """POST запрос к OpenRouter, возвращает распарсенный JSON из ответа модели."""
    payload = json.dumps({
        'model': 'google/gemini-flash-1.5',
        'messages': [
            {'role': 'system', 'content': system_msg},
            {'role': 'user', 'content': user_msg},
        ],
        'temperature': 0.7,
        'max_tokens': 1500,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=payload,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://poehali.dev',
            'X-Title': 'Suno Engineer Pro',
        },
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    content = data['choices'][0]['message']['content']
    return json.loads(content)


def handler(event: dict, context) -> dict:
    """
    Принимает URL трека-референса, парсит мета-теги страницы,
    отправляет в OpenRouter (gemini-flash-1.5) и возвращает
    три блока для Suno AI: style, structure, notes.
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
    extra = body.get('notes', '').strip()

    if not track_url:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'URL трека не может быть пустым'}, ensure_ascii=False)
        }

    if not re.match(r'https?://', track_url, re.IGNORECASE):
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Введите корректный URL (начинается с http:// или https://)'}, ensure_ascii=False)
        }

    source = get_source(track_url)
    meta = fetch_page_meta(track_url)

    lines = [f'Источник: {source}', f'URL: {track_url}']
    if meta.get('title'):
        lines.append(f"Название: {meta['title']}")
    if meta.get('description'):
        lines.append(f"Описание: {meta['description'][:800]}")
    if meta.get('genre'):
        lines.append(f"Жанр: {meta['genre']}")
    if extra:
        lines.append(f"Заметки: {extra}")

    system_prompt = """Ты — Suno Reverse Engineer Pro. Анализируешь метаданные трека и создаёшь промты для Suno AI.

Style Prompt: до 120 символов, английские теги через запятую. Порядок: жанр → темп → инструменты → вокал → пространство → динамика.
Перевод: тяжёлый мастеринг → "punchy dense mix", длинный реверб → "stadium reverb", дисторшн → "raw distorted vocals".

Lyrics Structure: секции в [квадратных скобках], технические теги отдельной строкой, место для текста в (скобках).

Верни ТОЛЬКО JSON:
{"style_prompt": "...", "lyrics_structure": "...", "engineering_notes": "..."}"""

    user_prompt = f"Проведи реверс-инжиниринг и создай промты для Suno AI:\n\n" + "\n".join(lines)

    api_key = os.environ['OPENROUTER_API_KEY']
    result = ask_ai(api_key, system_prompt, user_prompt)

    style = result.get('style_prompt', '')
    if len(style) > 120:
        style = style[:117] + '...'

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'style': style,
            'structure': result.get('lyrics_structure', ''),
            'notes': result.get('engineering_notes', ''),
            'meta': {
                'title': meta.get('title', ''),
                'source': source,
                'url': track_url,
            }
        }, ensure_ascii=False)
    }
