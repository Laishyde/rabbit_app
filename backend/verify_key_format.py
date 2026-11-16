import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"Current API Key: {api_key}")
print(f"Length: {len(api_key) if api_key else 0}")
print(f"Starts with 'gsk_': {api_key.startswith('gsk_') if api_key else False}")

# Groq API keys should start with 'gsk_' and be typically 56 characters
if api_key and api_key.startswith('gsk_') and len(api_key) == 56:
    print("✓ Format appears correct (starts with gsk_ and 56 characters)")
else:
    print("✗ Format may be incorrect")
    print("Expected format: gsk_ followed by 52 more characters (total 56)")
