"""
Service to extract and match voice embeddings.
"""
import numpy as np
from scipy.spatial.distance import cosine
from pyannote.audio import Model, Inference
from pyannote.core import Segment

from app.config import HF_TOKEN, DEVICE

_model = None
_inference = None

def get_inference():
    global _model, _inference
    if _model is None:
        _model = Model.from_pretrained("pyannote/wespeaker-voxceleb-resnet34-LM", use_auth_token=HF_TOKEN)
        if DEVICE == "cuda":
            import torch
            _model.to(torch.device("cuda"))
        _inference = Inference(_model, window="whole")
    return _inference

def extract_speaker_embeddings(audio_path: str, turns: list[dict]) -> dict:
    """
    Given an audio path and a list of speaker turns (from diarization),
    extracts an embedding for each unique speaker by averaging their embeddings
    over all their spoken segments.
    """
    inference = get_inference()
    
    # Group segments by speaker
    speaker_segments = {}
    for turn in turns:
        spk = turn["speaker"]
        if spk not in speaker_segments:
            speaker_segments[spk] = []
        speaker_segments[spk].append(Segment(turn["start"], turn["end"]))
    
    # Extract and average embeddings for each speaker
    speaker_embeddings = {}
    for spk, segments in speaker_segments.items():
        embeddings = []
        for seg in segments:
            # Crop the audio to the segment and extract the embedding
            # Some segments might be too short for the model, so we catch exceptions
            try:
                emb = inference.crop(audio_path, seg)
                # emb is usually a 1D numpy array
                if emb is not None and len(emb.shape) > 0:
                    embeddings.append(emb)
            except Exception as e:
                print(f"Skipping short segment for {spk}: {e}")
                continue
        
        if embeddings:
            # Average the embeddings for this speaker to get a stable fingerprint
            avg_emb = np.mean(embeddings, axis=0)
            # Normalize the vector (important for cosine similarity)
            avg_emb = avg_emb / np.linalg.norm(avg_emb)
            # Store as list of floats for JSON serialization
            speaker_embeddings[spk] = avg_emb.tolist()
            
    return speaker_embeddings

def match_speaker(embedding: list, known_profiles: list, threshold: float = 0.8) -> str | None:
    """
    Matches a new embedding against a list of known profiles.
    known_profiles should be a list of tuples: (profile_name, embedding_list)
    Returns the name of the best match if above threshold, else None.
    """
    if not embedding or not known_profiles:
        return None
        
    best_match = None
    best_similarity = -1.0
    
    vec1 = np.array(embedding)
    
    for name, prof_emb in known_profiles:
        vec2 = np.array(prof_emb)
        # scipy cosine distance is 1 - cosine similarity
        sim = 1 - cosine(vec1, vec2)
        if sim > best_similarity:
            best_similarity = sim
            best_match = name
            
    if best_similarity >= threshold:
        return best_match
    return None
