import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, JSON, Float, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status = Column(String, nullable=False, default="processing")  # processing | done | failed
    title = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True, default=list)
    decisions = Column(JSON, nullable=True, default=list)
    action_items = Column(JSON, nullable=True, default=list)
    transcript = Column(JSON, nullable=True, default=list)
    speaker_embeddings = Column(JSON, nullable=True, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SpeakerProfile(Base):
    __tablename__ = "speaker_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    # Store the embedding as a JSON array of floats for simplicity,
    # or ARRAY(Float) if postgres natively supports it.
    # JSON is easiest without pgvector extension.
    embedding = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)