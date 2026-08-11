"""
Converts uploaded audio (webm, mp4, etc.) to 16kHz mono WAV using ffmpeg,
since torchaudio/soundfile (used by pyannote) can't read compressed
container formats like webm directly.
"""
import subprocess
import os


def convert_to_wav(input_path: str) -> str:
    output_path = os.path.splitext(input_path)[0] + ".wav"

    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            output_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr}")

    return output_path