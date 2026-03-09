import os
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe(audio_path: str, model_size: str = "whisper-large-v3") -> dict:
    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    print(f"[Transcriber] Sending to Groq Whisper: {audio_path.name}")

    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            file=(audio_path.name, f.read()),
            model="whisper-large-v3",
            response_format="verbose_json",
            language="en",
        )

    segments = []
    for i, seg in enumerate(response.segments or []):
        # Handle both dict and object response formats
        if isinstance(seg, dict):
            text  = seg.get("text", "").strip()
            start = round(seg.get("start", 0), 2)
            end   = round(seg.get("end", 0), 2)
        else:
            text  = seg.text.strip()
            start = round(seg.start, 2)
            end   = round(seg.end, 2)

        segments.append({"id": i, "text": text, "start": start, "end": end})

    full_text = response.text.strip() if hasattr(response, "text") else " ".join(s["text"] for s in segments)
    duration  = segments[-1]["end"] if segments else 0.0

    print(f"[Transcriber] Done ✅ — {len(segments)} segments, {duration:.0f}s")

    return {
        "text":     full_text,
        "segments": segments,
        "language": getattr(response, "language", "en"),
        "duration": duration,
    }