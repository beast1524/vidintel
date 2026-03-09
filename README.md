# VidIntel — Video Intelligence Pipeline

One folder. Two parts. Full AI pipeline.

## Project Structure

```
vidintel/
├── frontend/          ← React app (port 3000)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/           ← FastAPI app (port 8000)
│   ├── pipeline/
│   │   ├── downloader.py     ✅ Module 1 - yt-dlp
│   │   ├── transcriber.py    🔜 Module 2 - Whisper
│   │   ├── chunker.py        🔜 Module 3 - Semantic Chunking
│   │   ├── llm.py            🔜 Module 4 - Mistral
│   │   ├── embedder.py       🔜 Module 5 - Sentence Transformers
│   │   └── vector_store.py   🔜 Module 6 - FAISS
│   ├── main.py               🔜 FastAPI routes
│   ├── models.py             🔜 Pydantic schemas
│   ├── data/
│   │   ├── audio/            ← downloaded audio files
│   │   └── indexes/          ← FAISS indexes
│   ├── .env
│   └── requirements.txt
│
├── start.bat          ← Windows: starts everything
└── README.md
```

## How to Run (3 terminals)

### Terminal 1 — Ollama (LLM)
```bash
ollama serve
```

### Terminal 2 — Backend
```bash
cd backend
venv\Scripts\activate
python main.py
```

### Terminal 3 — Frontend
```bash
cd frontend
npm start
```

Then open **http://localhost:3000** 🚀
