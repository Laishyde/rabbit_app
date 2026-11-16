import os
from dotenv import load_dotenv
from groq import Groq

# Force reload environment variables
load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key loaded: {api_key[:10]}...{api_key[-10:] if api_key else 'None'}")
print(f"API Key length: {len(api_key) if api_key else 0}")

try:
    client = Groq(api_key=api_key)
    
    # Test with a simple chat completion
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10
    )
    
    print("✓ API Key is valid!")
    print(f"Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"✗ API Key is invalid: {e}")
