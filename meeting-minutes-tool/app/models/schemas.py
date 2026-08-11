from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class ActionItem(BaseModel):
    owner: str
    task: str
    due: str | None = None


class MeetingMinutes(BaseModel):
    title: str
    summary: str
    key_points: list[str]
    decisions: list[str]
    action_items: list[ActionItem]


class ProcessMeetingResponse(BaseModel):
    id: UUID
    minutes: MeetingMinutes
    transcript: list[dict]


class MeetingListItem(BaseModel):
    id: UUID
    title: str
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True


class MeetingDetail(BaseModel):
    id: UUID
    title: str
    summary: str
    key_points: list[str]
    decisions: list[str]
    action_items: list[ActionItem]
    transcript: list[dict]
    created_at: datetime

    class Config:
        from_attributes = True