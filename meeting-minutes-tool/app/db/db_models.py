import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    meetings = relationship("Meeting", back_populates="owner")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # nullable=True for now for backward compat
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
    
    owner = relationship("User", back_populates="meetings")


class SpeakerProfile(Base):
    __tablename__ = "speaker_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    # Store the embedding as a JSON array of floats for simplicity,
    # or ARRAY(Float) if postgres natively supports it.
    # JSON is easiest without pgvector extension.
    embedding = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)