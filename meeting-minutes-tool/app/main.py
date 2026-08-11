from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import meetings
from app.db.database import init_db

app = FastAPI(title="Meeting Minutes Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}