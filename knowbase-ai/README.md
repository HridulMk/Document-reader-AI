# KnowBase AI — Chat with Your Documents

A portfolio-ready Retrieval-Augmented Generation (RAG) app. Upload PDF, DOCX, or TXT documents, index their chunks in Chroma, and ask questions with source citations.

## Architecture
- **Frontend:** Next.js App Router, TypeScript, CSS
- **API:** FastAPI + Python
- **Document parsing:** pypdf, python-docx
- **Embeddings / vector search:** Sentence Transformers + ChromaDB
- **LLM:** OpenAI-compatible chat API (provider and model configurable)
- **Metadata / vector persistence:** Chroma local persistent storage

## Requirements
- Python 3.10+
- Node.js 20+
- An API key for the configured LLM provider (optional for indexing; required for generated answers)

## Run locally

### 1. Start the backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add OPENAI_API_KEY in backend/.env for AI-generated answers
uvicorn app.main:app --reload --port 8000
```

### 2. Start the frontend in a second terminal
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Open http://localhost:3000. API docs: http://localhost:8000/docs.

## Features
- Upload and index PDF, DOCX, and TXT files
- Text extraction, overlapping chunking, local embedding generation
- Semantic retrieval from ChromaDB
- RAG answers constrained to retrieved passages
- Source citations with document name and page where available
- List and delete indexed documents
- Basic health endpoint and CORS configuration

## Environment variables
Backend (`backend/.env`):
- `OPENAI_API_KEY` — optional until you ask a question
- `OPENAI_BASE_URL` — optional OpenAI-compatible API base URL
- `LLM_MODEL` — default `gpt-4.1-mini`; change to a model available to your provider
- `CHROMA_PATH` — defaults to `./data/chroma`
- `UPLOAD_DIR` — defaults to `./data/uploads`
- `FRONTEND_ORIGIN` — defaults to `http://localhost:3000`

Frontend (`frontend/.env.local`):
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

## Important notes
- This is a local portfolio starter, not a production-secure multi-user service.
- Do not upload confidential documents. Add authentication, per-user document isolation, file scanning, rate limiting, and a managed database before public deployment.
- Chroma and the embedding model are initialized on the first backend run; the first run can take longer while the embedding model downloads.
- The app returns an explicit “not enough information” answer when retrieval finds no sufficiently relevant context.

## Suggested roadmap
1. Add sign-in and user-scoped document collections.
2. Add streaming answers and chat history.
3. Add AWS Bedrock as a selectable LLM provider.
4. Deploy FastAPI to a container host and frontend to Vercel.
5. Add evaluation tests for groundedness, retrieval quality, and citation correctness.
