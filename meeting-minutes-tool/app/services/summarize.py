"""
Summarization service — turns a speaker-labeled transcript into structured
meeting minutes using Groq's API.
"""
import json
from groq import Groq
from app.config import GROQ_API_KEY

_client = None

SYSTEM_PROMPT = """You are a meeting-minutes assistant. Given a speaker-labeled \
meeting transcript, produce a structured summary.

Respond ONLY with valid JSON in this exact shape, no markdown fences, no extra text:
{
  "title": "short descriptive title for the meeting",
  "summary": "2-4 sentence overview of what was discussed",
  "key_points": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "action_items": [
    {"owner": "speaker name or SPEAKER_00 if unknown", "task": "description", "due": "date or null"}
  ]
}
"""


def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def build_transcript_text(merged_segments: list[dict]) -> str:
    lines = [f"[{seg['speaker']}] {seg['text']}" for seg in merged_segments]
    return "\n".join(lines)


def summarize_transcript(merged_segments: list[dict], model: str = "llama3-70b-8192") -> dict:
    transcript_text = build_transcript_text(merged_segments)
    client = get_client()

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcript:\n\n{transcript_text}"},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    return json.loads(content)
