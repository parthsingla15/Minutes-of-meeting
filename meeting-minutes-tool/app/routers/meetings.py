import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.config import UPLOAD_DIR
from app.services.audio_convert import convert_to_wav
from app.services.transcribe import transcribe_audio
from app.services.diarize import diarize_audio, merge_transcript_with_speakers
from app.services.summarize import summarize_transcript
from app.services.embeddings import extract_speaker_embeddings, match_speaker
from app.models.schemas import ProcessMeetingAccepted, MeetingListItem, MeetingDetail
from app.db.database import get_db, SessionLocal
from app.db.db_models import Meeting, SpeakerProfile

router = APIRouter(prefix="/meetings", tags=["meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".webm"}


def run_pipeline(meeting_id: str, raw_path: str):
    """
    Runs in the background, after the HTTP response has already been sent.
    Uses its own DB session since the request-scoped one is gone by now.
    """
    db = SessionLocal()
    wav_path = None
    try:
        wav_path = convert_to_wav(raw_path)
        transcript_segments = transcribe_audio(wav_path)
        speaker_turns = diarize_audio(wav_path)
        
        # 1. Extract embeddings for all speakers in this meeting
        meeting_embeddings = extract_speaker_embeddings(wav_path, speaker_turns)
        
        # 2. Fetch known profiles from DB
        known_profiles = []
        for prof in db.query(SpeakerProfile).all():
            known_profiles.append((prof.name, prof.embedding))
            
        # 3. Match and rename speakers
        renamed_embeddings = {}
        speaker_map = {}
        for spk, emb in meeting_embeddings.items():
            match = match_speaker(emb, known_profiles, threshold=0.85)
            if match:
                speaker_map[spk] = match
                renamed_embeddings[match] = emb
            else:
                speaker_map[spk] = spk
                renamed_embeddings[spk] = emb
                
        # 4. Update speaker turns with matched names
        for turn in speaker_turns:
            if turn["speaker"] in speaker_map:
                turn["speaker"] = speaker_map[turn["speaker"]]
                
        merged = merge_transcript_with_speakers(transcript_segments, speaker_turns)
        minutes = summarize_transcript(merged)

        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        meeting.status = "done"
        meeting.title = minutes["title"]
        meeting.summary = minutes["summary"]
        meeting.key_points = minutes["key_points"]
        meeting.decisions = minutes["decisions"]
        meeting.action_items = minutes["action_items"]
        meeting.transcript = merged
        meeting.speaker_embeddings = renamed_embeddings
        db.commit()
    except Exception as e:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            meeting.status = "failed"
            meeting.error_message = str(e)
            db.commit()
    finally:
        db.close()
        if os.path.exists(raw_path):
            os.remove(raw_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)


@router.post("/process", response_model=ProcessMeetingAccepted, status_code=202)
async def process_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    file_id = str(uuid.uuid4())
    raw_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(raw_path, "wb") as f:
        f.write(await file.read())

    meeting = Meeting(status="processing")
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # Returns immediately — actual pipeline runs after response is sent,
    # avoiding Railway's proxy request timeout entirely.
    background_tasks.add_task(run_pipeline, str(meeting.id), raw_path)

    return ProcessMeetingAccepted(id=meeting.id, status="processing")


@router.get("", response_model=list[MeetingListItem])
def list_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).order_by(Meeting.created_at.desc()).all()


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
    return meeting

from pydantic import BaseModel

class LabelSpeakerRequest(BaseModel):
    old_speaker_name: str
    real_name: str

@router.post("/{meeting_id}/label-speaker")
def label_speaker(meeting_id: str, req: LabelSpeakerRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(404, "Meeting not found")
        
    if not meeting.speaker_embeddings or req.old_speaker_name not in meeting.speaker_embeddings:
        raise HTTPException(400, f"Speaker {req.old_speaker_name} not found in this meeting's embeddings")
        
    # Get the embedding that was temporarily stored
    embedding = meeting.speaker_embeddings[req.old_speaker_name]
    
    # Check if profile already exists
    profile = db.query(SpeakerProfile).filter(SpeakerProfile.name == req.real_name).first()
    if profile:
        profile.embedding = embedding # Update with the latest embedding
    else:
        profile = SpeakerProfile(name=req.real_name, embedding=embedding)
        db.add(profile)
        
    db.commit()
    return {"message": f"Successfully linked {req.old_speaker_name} to {req.real_name}"}