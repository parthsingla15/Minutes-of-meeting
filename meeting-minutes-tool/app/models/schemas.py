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
    minutes: MeetingMinutes
    transcript: list[dict]
