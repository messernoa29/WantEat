import anthropic

from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

MODEL = "claude-sonnet-4-6"


async def generate_meal_plan(prompt: str) -> str:
    message = await client.messages.create(
        model=MODEL,
        max_tokens=16000,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text
