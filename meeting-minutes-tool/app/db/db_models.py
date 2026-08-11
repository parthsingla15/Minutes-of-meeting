import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, JSON
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
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)