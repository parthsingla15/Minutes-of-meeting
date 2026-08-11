"""
Diarization service — figures out "who spoke when" using pyannote.audio.

Requires a Hugging Face token with access accepted for:
https://huggingface.co/pyannote/speaker-diarization-3.1
"""
from pyannote.audio import Pipeline
from app.config import HF_TOKEN, DEVICE

_pipeline = None


def get_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN,
        )
        if DEVICE == "cuda":
            import torch
            _pipeline.to(torch.device("cuda"))
    return _pipeline


def diarize_audio(audio_path: str) -> list[dict]:
    """
    Returns a list of speaker turns: [{"start": float, "end": float, "speaker": "SPEAKER_00"}, ...]
    """
    pipeline = get_pipeline()
    diarization = pipeline(audio_path)

    turns = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        turns.append({
            "start": round(turn.start, 2),
            "end": round(turn.end, 2),
            "speaker": speaker,
        })
    return turns


def merge_transcript_with_speakers(transcript_segments: list[dict], speaker_turns: list[dict]) -> list[dict]:
    """
    Assigns a speaker label to each transcript segment based on maximum time overlap
    with diarization turns.
    """
    merged = []
    for seg in transcript_segments:
        best_speaker = "UNKNOWN"
        best_overlap = 0.0
        for turn in speaker_turns:
            overlap = min(seg["end"], turn["end"]) - max(seg["start"], turn["start"])
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = turn["speaker"]
        merged.append({**seg, "speaker": best_speaker})
    return merged
