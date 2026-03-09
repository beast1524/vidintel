import os
import uuid
import json
import asyncio
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiofiles
from dotenv import load_dotenv

from models import ProcessUrlRequest, ProcessResponse, StatusResponse, QueryRequest, QueryResponse, Citation
from pipeline.downloader   import download_audio, cleanup_audio
from pipeline.transcriber  import transcribe
from pipeline.chunker      import chunk_transcript
from pipeline.llm          import process_transcript, answer_question, _fmt_time
from pipeline.embedder     import embed_chunks, embed_query
from pipeline.vector_store import save_index, search_index, index_exists

load_dotenv()

app = FastAPI(title="VidIntel API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])

JOBS        = {}
RESULTS_DIR = Path("data/results");  RESULTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR  = Path("data/uploads");  UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def update_job(job_id, **kwargs):
    if job_id in JOBS: JOBS[job_id].update(kwargs)


async def run_pipeline(job_id, video_id, url, audio_path, model_size):
    try:
        loop = asyncio.get_event_loop()

        if audio_path is None:
            update_job(job_id, step="downloading", progress=5)
            dl = await loop.run_in_executor(None, lambda: download_audio(url, video_id))
            audio_path = dl["audio_path"]
            title, duration = dl["title"], dl["duration"]
            update_job(job_id, progress=20)
        else:
            title, duration = Path(audio_path).stem, 0

        update_job(job_id, step="transcribing", progress=25)
        transcript = await loop.run_in_executor(None, lambda: transcribe(audio_path))
        update_job(job_id, progress=50)

        update_job(job_id, step="chunking", progress=55)
        chunks = await loop.run_in_executor(None, lambda: chunk_transcript(transcript["segments"]))
        update_job(job_id, progress=65)

        update_job(job_id, step="processing", progress=68)
        llm_results = await loop.run_in_executor(None, lambda: process_transcript(chunks, transcript["text"], url))
        update_job(job_id, progress=85)

        update_job(job_id, step="indexing", progress=88)
        embeddings = await loop.run_in_executor(None, lambda: embed_chunks(chunks))
        await loop.run_in_executor(None, lambda: save_index(video_id, embeddings, chunks))
        update_job(job_id, progress=95)

        results = {"video_id": video_id, "title": title, "duration": transcript["duration"] or duration, **llm_results}
        async with aiofiles.open(RESULTS_DIR / f"{video_id}.json", "w") as f:
            await f.write(json.dumps(results, ensure_ascii=False, indent=2))

        cleanup_audio(audio_path)
        update_job(job_id, status="complete", progress=100, step="done")
        print(f"[Pipeline] Job {job_id} complete ✅")

    except Exception as e:
        print(f"[Pipeline] Job {job_id} FAILED: {e}")
        update_job(job_id, status="error", message=str(e))


@app.post("/api/process", response_model=ProcessResponse)
async def process_url(req: ProcessUrlRequest, bg: BackgroundTasks):
    job_id, video_id = str(uuid.uuid4())[:8], str(uuid.uuid4())[:8]
    JOBS[job_id] = {"status":"processing","progress":0,"step":"downloading","message":"","video_id":video_id}
    bg.add_task(run_pipeline, job_id, video_id, req.url, None, req.model)
    return ProcessResponse(job_id=job_id, video_id=video_id)


@app.post("/api/upload", response_model=ProcessResponse)
async def upload_file(bg: BackgroundTasks, file: UploadFile = File(...), model: str = Form("whisper-large-v3")):
    job_id, video_id = str(uuid.uuid4())[:8], str(uuid.uuid4())[:8]
    upload_path = UPLOAD_DIR / f"{video_id}_{file.filename}"
    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(await file.read())
    JOBS[job_id] = {"status":"processing","progress":0,"step":"transcribing","message":"","video_id":video_id}
    bg.add_task(run_pipeline, job_id, video_id, "", str(upload_path), model)
    return ProcessResponse(job_id=job_id, video_id=video_id)


@app.get("/api/status/{job_id}", response_model=StatusResponse)
async def get_status(job_id: str):
    job = JOBS.get(job_id)
    if not job: raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return StatusResponse(job_id=job_id, status=job["status"], progress=job["progress"], step=job["step"], message=job.get("message",""))


@app.get("/api/results/{video_id}")
async def get_results(video_id: str):
    path = RESULTS_DIR / f"{video_id}.json"
    if not path.exists(): raise HTTPException(status_code=404, detail="Results not found")
    async with aiofiles.open(path) as f:
        return json.loads(await f.read())


@app.post("/api/query", response_model=QueryResponse)
async def query_rag(req: QueryRequest):
    if not index_exists(req.video_id): raise HTTPException(status_code=404, detail="No index found")
    loop = asyncio.get_event_loop()
    q_vec      = await loop.run_in_executor(None, lambda: embed_query(req.question))
    top_chunks = await loop.run_in_executor(None, lambda: search_index(req.video_id, q_vec, top_k=5))
    if not top_chunks:
        return QueryResponse(answer="I couldn't find relevant content for that question.", citations=[])
    context = "\n\n".join(f"[{_fmt_time(c['start'])} - {_fmt_time(c['end'])}]\n{c['text']}" for c in top_chunks)
    answer  = await loop.run_in_executor(None, lambda: answer_question(req.question, context))
    citations = [Citation(chunk_id=c["id"], timestamp=_fmt_time(c["start"]), text=c["text"][:120]+"..." if len(c["text"])>120 else c["text"]) for c in top_chunks[:3]]
    return QueryResponse(answer=answer, citations=citations)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "VidIntel API (Groq)"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=os.getenv("HOST","0.0.0.0"), port=int(os.getenv("PORT",8000)), reload=True)