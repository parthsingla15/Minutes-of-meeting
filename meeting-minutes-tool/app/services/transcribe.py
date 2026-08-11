"""
Transcription service — converts audio to text using faster-whisper.

Model loads once and stays in memory (loading it per-request is slow).
"""
from faster_whisper import WhisperModel
from app.config import WHISPER_MODEL, DEVICE

_model = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        compute_type = "int8" if DEVICE == "cpu" else "float16"
        _model = WhisperModel(WHISPER_MODEL, device=DEVICE, compute_type=compute_type)
    return _model


def transcribe_audio(audio_path: str) -> list[dict]:
    """
    Returns a list of segments: [{"start": float, "end": float, "text": str}, ...]
    """
    model = get_model()
    segments, _info = model.transcribe(audio_path, beam_size=5, vad_filter=True)

    result = []
    for seg in segments:
        result.append({
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        })
    return result
