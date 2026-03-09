import os
import re
import subprocess
import uuid
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

AUDIO_DIR = Path(os.getenv("AUDIO_DIR", "data/audio"))
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def download_audio(url: str, video_id: str = None) -> dict:
    if not video_id:
        video_id = str(uuid.uuid4())[:8]

    safe_id  = re.sub(r"[^a-zA-Z0-9_\-]", "_", video_id)
    out_tmpl = str(AUDIO_DIR / f"{safe_id}.%(ext)s")

    # Snapshot files BEFORE download
    before = set(AUDIO_DIR.iterdir())

    # Get metadata
    try:
        meta = subprocess.run(
            ["yt-dlp", "--print", "%(title)s|||%(duration)s", "--no-playlist", "--quiet", url],
            capture_output=True, text=True, timeout=60
        )
        meta_line = meta.stdout.strip().splitlines()[0] if meta.stdout.strip() else "Unknown|||0"
        title, duration = meta_line.split("|||", 1)
        title    = title.strip()
        duration = int(float(duration.strip() or 0))
    except Exception:
        title, duration = "Unknown", 0

    # Download audio
    result = subprocess.run(
        [
            "yt-dlp", "-x",
            "--audio-format", "wav",
            "--audio-quality", "0",
            "--postprocessor-args", "ffmpeg:-ar 16000 -ac 1",
            "--no-playlist",
            "--quiet",
            "-o", out_tmpl,
            url,
        ],
        capture_output=True, text=True, timeout=600
    )

    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr.strip()}")

    # Find NEW file by comparing before/after
    after  = set(AUDIO_DIR.iterdir())
    new_files = after - before

    print(f"[Downloader] New files found: {[f.name for f in new_files]}")

    if new_files:
        found = list(new_files)[0]
    else:
        # Fallback — search by stem
        audio_extensions = (".wav", ".mp3", ".m4a", ".webm", ".ogg", ".opus")
        found = next((f for f in AUDIO_DIR.iterdir() if f.stem == safe_id and f.suffix.lower() in audio_extensions), None)

    if not found:
        all_files = list(AUDIO_DIR.iterdir())
        raise RuntimeError(f"Audio file not found. Files in dir: {[f.name for f in all_files]}")

    print(f"[Downloader] Downloaded: {found.name} ✅")

    return {
        "video_id":   safe_id,
        "audio_path": str(found.resolve()),
        "title":      title,
        "duration":   duration,
        "url":        url,
    }


def cleanup_audio(audio_path: str) -> None:
    try:
        Path(audio_path).unlink(missing_ok=True)
    except Exception:
        pass