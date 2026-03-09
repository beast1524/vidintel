"""
vector_store.py
───────────────
Module 6: Vector Storage & Retrieval via FAISS

Stores chunk embeddings in a FAISS IndexFlatIP (inner product,
equivalent to cosine similarity on normalized vectors).
Persists index + chunk metadata to disk keyed by video_id.

Usage:
    from pipeline.vector_store import save_index, search_index
    save_index(video_id, embeddings, chunks)
    results = search_index(video_id, query_embedding, top_k=5)
"""

import os
import json
import numpy as np
import faiss
from pathlib import Path
from typing import List
from dotenv import load_dotenv

load_dotenv()

INDEX_DIR = Path(os.getenv("INDEX_DIR", "data/indexes"))
INDEX_DIR.mkdir(parents=True, exist_ok=True)


def save_index(video_id: str, embeddings: np.ndarray, chunks: List[dict]) -> None:
    """
    Build a FAISS index from embeddings and persist to disk.

    Args:
        video_id:   Unique video identifier (used as folder name).
        embeddings: float32 numpy array of shape (n, 384).
        chunks:     Original chunk dicts (text + timestamps).
    """
    if embeddings.shape[0] == 0:
        raise ValueError("No embeddings to index.")

    video_dir = INDEX_DIR / video_id
    video_dir.mkdir(parents=True, exist_ok=True)

    # Build FAISS index — IndexFlatIP = exact inner product search
    dim   = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    # Save FAISS index
    faiss.write_index(index, str(video_dir / "index.faiss"))

    # Save chunk metadata alongside
    with open(video_dir / "chunks.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"[VectorStore] Saved index for {video_id} ({index.ntotal} vectors) ✅")


def load_index(video_id: str):
    """Load a FAISS index + chunks from disk. Returns (index, chunks)."""
    video_dir = INDEX_DIR / video_id
    index_path  = video_dir / "index.faiss"
    chunks_path = video_dir / "chunks.json"

    if not index_path.exists():
        raise FileNotFoundError(f"No index found for video_id: {video_id}")

    index  = faiss.read_index(str(index_path))
    chunks = json.loads(chunks_path.read_text(encoding="utf-8"))
    return index, chunks


def search_index(
    video_id: str,
    query_embedding: np.ndarray,
    top_k: int = 5,
) -> List[dict]:
    """
    Search the FAISS index for the most relevant chunks.

    Args:
        video_id:        Which video's index to search.
        query_embedding: float32 array of shape (1, 384).
        top_k:           Number of results to return.

    Returns:
        List of chunk dicts with an added 'score' field (0-1).
    """
    index, chunks = load_index(video_id)
    top_k = min(top_k, index.ntotal)

    scores, indices = index.search(query_embedding, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        chunk = dict(chunks[idx])
        chunk["score"] = round(float(score), 4)
        results.append(chunk)

    return results


def index_exists(video_id: str) -> bool:
    """Check if a FAISS index already exists for a video."""
    return (INDEX_DIR / video_id / "index.faiss").exists()
