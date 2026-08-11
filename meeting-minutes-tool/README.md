# Meeting Minutes Tool — Phase 1 (Pipeline)

Bot-free AI meeting minutes tool. This is **Phase 1**: the core processing
pipeline (audio file in → transcript → speaker diarization → structured
minutes out). No live audio capture yet — that's Phase 2 (Electron desktop
app).

## What it does

1. Upload a pre-recorded audio file (`.mp3`, `.wav`, `.m4a`, `.mp4`, `.webm`)
2. **Transcribe** it with `faster-whisper` (self-hosted, free)
3. **Diarize** it with `pyannote.audio` — figures out who spoke when (self-hosted, free)
4. **Summarize** with Groq — structured JSON with summary, key points, decisions, action items
5. Audio file is deleted after processing (privacy-first)

## Setup

```bash
# 1. Create a virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy env template and fill in your keys
cp .env.example .env
```

You'll need:
- **Groq API key** — free at https://console.groq.com/keys
- **Hugging Face token** — free at https://huggingface.co/settings/tokens
  - Also accept the terms at https://huggingface.co/pyannote/speaker-diarization-3.1
    (pyannote's diarization model is gated — no payment needed, just accept terms)

## Run

```bash
uvicorn app.main:app --reload
```

Server runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

## Test it

Use the `/docs` Swagger UI, or curl:

```bash
curl -X POST http://localhost:8000/meetings/process \
  -F "file=@/path/to/your/recording.mp3"
```

Response:
```json
{
  "minutes": {
    "title": "...",
    "summary": "...",
    "key_points": ["..."],
    "decisions": ["..."],
    "action_items": [{"owner": "...", "task": "...", "due": null}]
  },
  "transcript": [
    {"start": 0.0, "end": 3.5, "text": "...", "speaker": "SPEAKER_00"}
  ]
}
```

## Notes

- First run downloads the Whisper model (~150MB for `base`) and pyannote
  models — expect a delay on first request.
- `DEVICE=cpu` in `.env` works but is slow (~10-20 min for a 1-hour meeting).
  Set `DEVICE=cuda` if you have a GPU.
- Speaker labels are generic (`SPEAKER_00`, `SPEAKER_01`, ...) — mapping
  those to real names (voice-embedding matching) is a Phase 2/4 feature per
  the project plan.

## Next steps (per the project plan)

- **Phase 2**: Electron desktop app with system audio capture (WASAPI on
  Windows, BlackHole/ScreenCaptureKit on Mac) — feeds audio into this same
  pipeline instead of a manual file upload.
- **Phase 3**: Next.js dashboard + Postgres storage, deployed to
  Vercel (frontend) + Railway/Render (this backend).
