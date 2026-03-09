"""
embedder.py
───────────
Module 5: Embedding via Sentence Transformers

Converts transcript chunks into 384-dimensional dense vectors
using the all-MiniLM-L6-v2 model — same model used for chunking.

Usage:
    from pipeline.embedder import embed_chunks
    embeddings = embed_chunks(chunks)
"""

import numpy as np
from typing import List
from sentence_transformers import SentenceTransformer

# Reuse same model instance as chunker if already loaded
_encoder = None

def get_encoder():
    global _encoder
    if _encoder is None:
        print("[Embedder] Loading sentence-transformers model...")
        _encoder = SentenceTransformer("all-MiniLM-L6-v2")
        print("[Embedder] Model loaded ✅")
    return _encoder


def embed_chunks(chunks: List[dict]) -> np.ndarray:
    """
    Embed a list of transcript chunks.

    Args:
        chunks: List of chunk dicts with 'text' key.

    Returns:
        numpy array of shape (n_chunks, 384) — float32
    """
    if not chunks:
        return np.array([], dtype=np.float32)

    encoder = get_encoder()
    texts   = [c["text"] for c in chunks]

    print(f"[Embedder] Embedding {len(texts)} chunks...")
    embeddings = encoder.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
        normalize_embeddings=True,   # L2 normalize for cosine similarity
    ).astype(np.float32)

    print(f"[Embedder] Done ✅ — shape: {embeddings.shape}")
    return embeddings


def embed_query(query: str) -> np.ndarray:
    """
    Embed a single query string for RAG retrieval.

    Returns:
        numpy array of shape (1, 384) — float32
    """
    encoder = get_encoder()
    vec = encoder.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True,
    ).astype(np.float32)
    return vec
