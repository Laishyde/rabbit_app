import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from .env file (force reload)
load_dotenv(override=True)

def get_groq_client():
    """Initialize and return Groq client with API key from environment"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    
    # Log para debug - mostrar qual API key está sendo usada
    print(f"🔑 [CONFIG] API Key carregada: {api_key[:10]}...{api_key[-10:]}")
    print(f"🔑 [CONFIG] API Key length: {len(api_key)}")
    
    return Groq(api_key=api_key)

def get_groq_model():
    # Se estiver 'llama3-8b-8192', mude para:
    return "llama-3.1-8b-instant"

def get_hf_token():
    """Get Hugging Face token from environment"""
    token = os.getenv("HF_TOKEN")
    if not token:
        raise ValueError("HF_TOKEN environment variable is not set")
    return token
