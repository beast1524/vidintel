"""
models.py
─────────
Pydantic schemas for all FastAPI request and response bodies.
"""

from pydantic import BaseModel, HttpUrl
from typing import List, Optional


# ── Requests ──────────────────────────────────────────────────────

class ProcessUrlRequest(BaseModel):
    url:   str
    model: str = "whisper-medium"


class QueryRequest(BaseModel):
    video_id: str
    question: str


# ── Responses ─────────────────────────────────────────────────────

class ProcessResponse(BaseModel):
    job_id:   str
    video_id: str
    message:  str = "Processing started"


class StatusResponse(BaseModel):
    job_id:   str
    status:   str          # processing | complete | error
    progress: int = 0      # 0-100
    step:     str = ""     # downloading | transcribing | chunking | processing | indexing
    message:  str = ""


class TimestampItem(BaseModel):
    label:       str    # "00:02:15"
    seconds:     float
    description: str


class NoteSection(BaseModel):
    title:  str
    points: List[str]


class ResultsResponse(BaseModel):
    video_id:   str
    title:      str
    duration:   int
    summary:    str
    notes:      List[NoteSection]
    timestamps: List[TimestampItem]
    actions:    List[str]
    videoUrl:   str


class Citation(BaseModel):
    chunk_id:  int
    timestamp: str    # "00:02:15"
    text:      str    # excerpt from chunk


class QueryResponse(BaseModel):
    answer:    str
    citations: List[Citation]
