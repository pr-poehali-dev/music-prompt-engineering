import os
import json
from openai import OpenAI

def handler(event: dict, context) -> dict:
    """
    Генерирует Suno AI промты на основе описания трека.
    Возвращает три блока: style_prompt, lyrics_structure, engineering_notes.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    track_description = body.get('description', '').strip()

    if not track_description:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Описание трека не может быть пустым'})
        }

    if len(track_description) > 5000:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Описание слишком длинное (максимум 5000 символов)'})
        }

    client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

    system_prompt = """Ты — Suno Reverse Engineer Pro, передовой AI-звукорежиссёр и эксперт по промт-инжинирингу для генеративных музыкальных нейросетей.

Твоя задача — провести виртуальный реверс-инжиниринг предоставленного описания трека и сгенерировать идеальные промты для Suno AI.

ПРАВИЛА ПЕРЕВОДА (TECH → SUNO):
- Тяжёлый мастеринг/лимитер → "punchy, loud, energetic, dense"
- Долгий хвост реверба → "ethereal, stadium sound, cinematic, atmospheric"
- Вокальный дисторшн → "raw vocals, distorted voice, megaphone effect"
- Style Prompt: СТРОГО до 120 символов, теги на английском через запятую, от макро-жанра к микро-деталям

Ответь СТРОГО в формате JSON без лишних комментариев:
{
  "style_prompt": "теги через запятую, до 120 символов",
  "lyrics_structure": "структура трека с мета-тегами в квадратных скобках",
  "engineering_notes": "2-3 предложения о ключевых звукорежиссёрских приёмах"
}

Для lyrics_structure используй формат:
[Section Name]
[Additional Tags]
(описание или место для текста)

Пример секций: Instrumental Intro, Verse 1, Pre-Chorus, Chorus, Bridge, Drop, Outro"""

    response = client.chat.completions.create(
        model='gpt-4o-mini',
        messages=[
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': f'Вот описание референсного трека:\n\n{track_description}'}
        ],
        temperature=0.7,
        max_tokens=1500,
        response_format={'type': 'json_object'}
    )

    result_text = response.choices[0].message.content
    result = json.loads(result_text)

    style = result.get('style_prompt', '')
    if len(style) > 120:
        style = style[:117] + '...'

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'style': style,
            'structure': result.get('lyrics_structure', ''),
            'notes': result.get('engineering_notes', '')
        }, ensure_ascii=False)
    }
