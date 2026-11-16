import requests
import io

# Test the audio upload endpoint with fake audio data
print("Testing audio upload endpoint...")

# Create fake audio data (simulating a small audio file)
fake_audio = b"fake audio data for testing" * 100  # ~2KB of data

try:
    response = requests.post(
        "http://127.0.0.1:8000/api/process-voice",
        files={"file": ("test.webm", fake_audio, "audio/webm")}
    )
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
