import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import UPLOAD_DIR
from app.services.transcribe import transcribe_audio
from app.services.diarize import diarize_audio, merge_transcript_with_speakers
from app.services.summarize import summarize_transcript
from app.models.schemas import ProcessMeetingResponse

router = APIRouter(prefix="/meetings", tags=["meetings"])

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".webm"}


@router.post("/process", response_model=ProcessMeetingResponse)
async def process_meeting(file: UploadFile = File(...)):
    """
    Upload an audio file -> transcribe -> diarize -> summarize.
    Phase 1 pipeline: no live audio capture yet, just file-in / minutes-out.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    file_id = str(uuid.uuid4())
    audio_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(audio_path, "wb") as f:
        f.write(await file.read())

    try:
        transcript_segments = transcribe_audio(audio_path)
        speaker_turns = diarize_audio(audio_path)
        merged = merge_transcript_with_speakers(transcript_segments, speaker_turns)
        minutes = summarize_transcript(merged)
    except Exception as e:
        raise HTTPException(500, f"Pipeline failed: {e}")
    finally:
        # audio deleted after processing — privacy-first, matches plan
        if os.path.exists(audio_path):
            os.remove(audio_path)

    return ProcessMeetingResponse(minutes=minutes, transcript=merged)
