from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ActionItem(BaseModel):
    owner: str
    task: str
    due: str | None = None


class ProcessMeetingAccepted(BaseModel):
    id: UUID
    status: str


class MeetingListItem(BaseModel):
    id: UUID
    status: str
    title: str | None = None
    summary: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingDetail(BaseModel):
    id: UUID
    status: str
    title: str | None = None
    summary: str | None = None
    key_points: list[str] | None = None
    decisions: list[str] | None = None
    action_items: list[ActionItem] | None = None
    transcript: list[dict] | None = None
    error_message: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True