import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.services.audio_convert import convert_to_wav
from app.services.transcribe import transcribe_audio
from app.services.diarize import diarize_audio, merge_transcript_with_speakers
from app.services.summarize import summarize_transcript
from app.models.schemas import ProcessMeetingResponse, MeetingListItem, MeetingDetail
from app.db.database import get_db
from app.db.db_models import Meeting

router = APIRouter(prefix="/meetings", tags=["meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".webm"}


@router.post("/process", response_model=ProcessMeetingResponse)
async def process_meeting(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    file_id = str(uuid.uuid4())
    raw_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(raw_path, "wb") as f:
        f.write(await file.read())

    wav_path = None
    try:
        # Normalize to 16kHz mono WAV so torchaudio/soundfile (pyannote) can read it,
        # regardless of what format the recorder produced (webm, mp4, etc.)
        wav_path = convert_to_wav(raw_path)

        transcript_segments = transcribe_audio(wav_path)
        speaker_turns = diarize_audio(wav_path)
        merged = merge_transcript_with_speakers(transcript_segments, speaker_turns)
        minutes = summarize_transcript(merged)
    except Exception as e:
        raise HTTPException(500, f"Pipeline failed: {e}")
    finally:
        if os.path.exists(raw_path):
            os.remove(raw_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)

    meeting = Meeting(
        title=minutes["title"],
        summary=minutes["summary"],
        key_points=minutes["key_points"],
        decisions=minutes["decisions"],
        action_items=minutes["action_items"],
        transcript=merged,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    return ProcessMeetingResponse(id=meeting.id, minutes=minutes, transcript=merged)


@router.get("", response_model=list[MeetingListItem])
def list_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting