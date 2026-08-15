from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.db import db_models  # noqa: F401 — ensures models are registered
    Base.metadata.create_all(bind=engine)
    
    # Simple migration: add speaker_embeddings column if missing
    try:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE meetings ADD COLUMN speaker_embeddings JSON DEFAULT '{}';"))
    except Exception:
        # Column already exists or other error
        pass