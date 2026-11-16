import requests
import base64
from app.services.tts_service import text_to_speech

# Test TTS function
test_text = "Olá amiguinho! Sou o Velho Corujão."
print(f"Testing TTS with text: '{test_text}'")

try:
    audio_bytes = text_to_speech(test_text)
    print(f"TTS Success! Generated {len(audio_bytes)} bytes of audio")
    
    # Save to file for manual testing
    with open("test_output.wav", "wb") as f:
        f.write(audio_bytes)
    print("Saved to test_output.wav")
    
    # Also test via API endpoint
    print("\nTesting via API endpoint...")
    response = requests.post("http://127.0.0.1:8000/api/process-voice", files={"file": ("test.webm", b"fake audio data", "audio/webm")})
    print(f"API Response status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"API Response keys: {data.keys()}")
        if "audio" in data:
            print(f"Audio field present, length: {len(data['audio'])} characters")
        else:
            print("No audio field in response")
    else:
        print(f"API Error: {response.text}")
        
except Exception as e:
    print(f"TTS Error: {str(e)}")
    import traceback
    traceback.print_exc()
