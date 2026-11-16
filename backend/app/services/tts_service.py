import requests
import os
import tempfile
from app.config import get_hf_token

def text_to_speech(text: str) -> bytes:
    """
    Convert text to speech using Hugging Face's parler-tts/parler-tts-mini-v1 model.
    
    Args:
        text: The text to convert to speech (narrator_response from Velho Corujão)
    
    Returns:
        bytes: Audio data in WAV format
    
    Raises:
        ValueError: If HF_TOKEN is not set
        Exception: If the API request fails
    """
    # Get Hugging Face token
    token = get_hf_token()
    
    # Voice description for the Wise Owl (Velho Corujão)
    voice_description = "A wise, deep-toned, slow-paced male voice speaking in a calm, mystical, and grandfatherly educational tone."
    
    # Try multiple endpoints in order
    endpoints = [
        "https://api-inference.huggingface.co/models/parler-tts/parler-tts-mini-v1",
        "https://huggingface.co/api/models/parler-tts/parler-tts-mini-v1/inference",
    ]
    
    # Prepare the payload
    payload = {
        "inputs": f"{voice_description} {text}",
        "parameters": {
            "return_timestamps": False
        }
    }
    
    # Headers with authentication
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    last_error = None
    for api_url in endpoints:
        try:
            print(f"Tentando endpoint: {api_url}")
            response = requests.post(api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                audio_bytes = response.content
                print(f"✓ Sucesso com endpoint: {api_url}")
                return audio_bytes
            else:
                last_error = f"Status {response.status_code}: {response.text}"
                print(f"✗ Falha no endpoint {api_url}: {last_error}")
                
        except requests.exceptions.Timeout:
            last_error = "Timeout"
            print(f"✗ Timeout no endpoint: {api_url}")
        except requests.exceptions.ConnectionError as e:
            last_error = str(e)
            print(f"✗ Erro de conexão no endpoint {api_url}: {e}")
        except Exception as e:
            last_error = str(e)
            print(f"✗ Erro no endpoint {api_url}: {e}")
    
    # All endpoints failed
    raise Exception(f"Todos os endpoints falharam. Último erro: {last_error}")

def text_to_speech_file(text: str) -> str:
    """
    Convert text to speech and save to a temporary WAV file.
    
    Args:
        text: The text to convert to speech
    
    Returns:
        str: Path to the temporary WAV file
    
    Raises:
        ValueError: If HF_TOKEN is not set
        Exception: If the API request fails or file cannot be saved
    """
    audio_bytes = text_to_speech(text)
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.wav', delete=False) as temp_file:
        temp_file.write(audio_bytes)
        temp_file_path = temp_file.name
    
    return temp_file_path
