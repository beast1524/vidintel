import os
import json
from typing import List
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL  = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _ask(system: str, user: str, temperature: float = 0.3) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return response.choices[0].message.content.strip()


def generate_summary(full_text: str) -> str:
    print("[LLM] Generating summary...")
    return _ask(
        system="You are an expert summarizer. Write clear, concise summaries in plain prose — no bullet points.",
        user=f"Summarize this transcript in about 300 words.\n\nTRANSCRIPT:\n{full_text[:6000]}",
    )


def generate_notes(chunks: List[dict]) -> List[dict]:
    print("[LLM] Generating structured notes...")
    chunk_text = "\n\n".join(
        f"[{_fmt_time(c['start'])} - {_fmt_time(c['end'])}]\n{c['text']}"
        for c in chunks[:20]
    )
    raw = _ask(
        system="You are a note-taking assistant. Return ONLY valid JSON — no markdown, no extra text.",
        user=f"""Create structured notes. Return JSON array:
[{{"title": "Section Title", "points": ["point 1", "point 2"]}}]
Create 3-6 sections with 2-5 points each.

TRANSCRIPT:\n{chunk_text}""",
    )
    return _parse_json(raw, fallback=[{"title": "Key Points", "points": ["See summary for details"]}])


def generate_timestamps(chunks: List[dict]) -> List[dict]:
    print("[LLM] Extracting key timestamps...")
    chunk_text = "\n".join(f"[{_fmt_time(c['start'])}] {c['text'][:200]}" for c in chunks)
    raw = _ask(
        system="You extract key moments from transcripts. Return ONLY valid JSON — no markdown.",
        user=f"""Identify 5-8 important moments. Return JSON array:
[{{"label": "00:02:15", "seconds": 135, "description": "What happens here"}}]

TRANSCRIPT:\n{chunk_text[:4000]}""",
    )
    return _parse_json(raw, fallback=[])


def generate_actions(full_text: str) -> List[str]:
    print("[LLM] Extracting action items...")
    raw = _ask(
        system="You extract actionable insights. Return ONLY a JSON array of strings — no markdown.",
        user=f"Extract 5-8 action items or key takeaways. Return: [\"Action 1\", \"Action 2\"]\n\nTRANSCRIPT:\n{full_text[:4000]}",
    )
    return _parse_json(raw, fallback=["Review the full transcript for action items"])


def answer_question(question: str, context: str) -> str:
    return _ask(
        system="You answer questions about video content using only the provided transcript excerpts. Be concise. If the answer isn't in the excerpts, say so.",
        user=f"TRANSCRIPT EXCERPTS:\n{context}\n\nQUESTION: {question}",
        temperature=0.1,
    )


def process_transcript(chunks: List[dict], full_text: str, video_url: str = "") -> dict:
    return {
        "summary":    generate_summary(full_text),
        "notes":      generate_notes(chunks),
        "timestamps": generate_timestamps(chunks),
        "actions":    generate_actions(full_text),
        "videoUrl":   video_url,
    }


def _fmt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _parse_json(raw: str, fallback):
    try:
        clean = raw.strip()
        if "```" in clean:
            clean = clean.split("```")[1]
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
    except Exception:
        return fallback