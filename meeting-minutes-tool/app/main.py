from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import meetings
from app.db.database import init_db

app = FastAPI(title="Meeting Minutes Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later to your real Vercel URL
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)


@app.on_event("startup")
def on_startup():
    init_db()

    # Preload heavy ML models now, during container startup, instead of on
    # the first user request. This moves the ~10min download+load cost out
    # of Railway's HTTP request timeout window and into deploy time instead.
    print("Preloading Whisper model...")
    from app.services.transcribe import get_model as get_whisper_model
    get_whisper_model()

    print("Preloading pyannote diarization pipeline...")
    from app.services.diarize import get_pipeline as get_diarize_pipeline
    get_diarize_pipeline()

    print("Models preloaded — ready to serve requests.")


@app.get("/health")
def health():
    return {"status": "ok"}