import io

def process_audio_bytes(audio_bytes: bytes) -> bytes:
    """Process and validate audio bytes before sending to Groq"""
    # Basic validation - ensure we have audio data
    if not audio_bytes:
        raise ValueError("No audio data received")
    
    # Ensure minimum size (at least 1KB of audio)
    if len(audio_bytes) < 1024:
        raise ValueError("Audio data too small")
    
    # Maximum size limit (25MB for Groq)
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise ValueError("Audio data too large (max 25MB)")
    
    return audio_bytes

def convert_to_webm(audio_bytes: bytes, original_format: str) -> bytes:
    """Convert audio to webm format if needed"""
    # For now, assume the audio is already in a compatible format
    # In production, you might use ffmpeg or similar for conversion
    return audio_bytes
