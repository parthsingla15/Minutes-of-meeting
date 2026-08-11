import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    key_points = Column(JSON, nullable=False, default=list)
    decisions = Column(JSON, nullable=False, default=list)
    action_items = Column(JSON, nullable=False, default=list)
    transcript = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)