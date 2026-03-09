"""
chunker.py
──────────
Module 3: Semantic Chunking via Sentence Transformers

Takes Whisper segments, groups them into meaningful topic-based
chunks using cosine similarity between sentence embeddings.

Usage:
    from pipeline.chunker import chunk_transcript
    chunks = chunk_transcript(segments, max_tokens=300)
"""

from sentence_transformers import SentenceTransformer, util
from typing import List

# Cache the model
_encoder = None

def get_encoder():
    global _encoder
    if _encoder is None:
        print("[Chunker] Loading sentence-transformers model...")
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
        print("[Chunker] Model loaded ✅")
    return _encoder


def chunk_transcript(
    segments: List[dict],
    max_tokens: int = 300,
    similarity_threshold: float = 0.45,
) -> List[dict]:
    """
    Group Whisper segments into semantic chunks.

    Strategy:
      1. Embed each segment text with all-MiniLM-L6-v2
      2. Compute cosine similarity between adjacent segments
      3. Place a chunk boundary where similarity drops below threshold
         OR where chunk word count exceeds max_tokens

    Args:
        segments:             List of Whisper segments (text, start, end)
        max_tokens:           Max words per chunk before forcing a split
        similarity_threshold: Cosine similarity below this → new chunk

    Returns:
        List of chunks, each with:
            - id         : int
            - text       : str   — combined segment text
            - start      : float — start timestamp (seconds)
            - end        : float — end timestamp (seconds)
            - word_count : int
    """
    if not segments:
        return []

    encoder = get_encoder()

    # Embed all segment texts
    texts = [s["text"] for s in segments]
    embeddings = encoder.encode(texts, convert_to_tensor=True, show_progress_bar=False)

    # Build chunks
    chunks      = []
    chunk_segs  = [segments[0]]
    chunk_words = len(segments[0]["text"].split())

    for i in range(1, len(segments)):
        seg = segments[i]
        words_in_seg = len(seg["text"].split())

        # Compute similarity between this segment and previous
        sim = float(util.cos_sim(embeddings[i - 1], embeddings[i]))

        # Decide: continue current chunk or start new one
        force_split = (chunk_words + words_in_seg) > max_tokens
        topic_shift = sim < similarity_threshold

        if force_split or topic_shift:
            # Save current chunk
            chunks.append(_build_chunk(len(chunks), chunk_segs))
            chunk_segs  = [seg]
            chunk_words = words_in_seg
        else:
            chunk_segs.append(seg)
            chunk_words += words_in_seg

    # Don't forget the last chunk
    if chunk_segs:
        chunks.append(_build_chunk(len(chunks), chunk_segs))

    print(f"[Chunker] Created {len(chunks)} chunks from {len(segments)} segments ✅")
    return chunks


def _build_chunk(chunk_id: int, segs: List[dict]) -> dict:
    """Merge a list of segments into one chunk dict."""
    text = " ".join(s["text"] for s in segs).strip()
    return {
        "id":         chunk_id,
        "text":       text,
        "start":      segs[0]["start"],
        "end":        segs[-1]["end"],
        "word_count": len(text.split()),
    }


# ── Quick manual test ─────────────────────────────────────────────
if __name__ == "__main__":
    # Fake segments for testing
    test_segments = [
        {"id": 0, "text": "Welcome to this lecture on machine learning.", "start": 0.0,  "end": 4.0},
        {"id": 1, "text": "Today we will cover supervised learning.", "start": 4.0,  "end": 8.0},
        {"id": 2, "text": "Supervised learning uses labeled data.", "start": 8.0,  "end": 12.0},
        {"id": 3, "text": "Now let us talk about neural networks.", "start": 12.0, "end": 16.0},
        {"id": 4, "text": "Neural networks are inspired by the brain.", "start": 16.0, "end": 20.0},
        {"id": 5, "text": "The economy grew by 3 percent last quarter.", "start": 20.0, "end": 24.0},
    ]

    chunks = chunk_transcript(test_segments)
    for c in chunks:
        print(f"\nChunk {c['id']} [{c['start']}s → {c['end']}s] ({c['word_count']} words)")
        print(f"  {c['text']}")
