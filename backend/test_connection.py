import requests
import socket

# Test basic internet connectivity
print("Testing basic internet connectivity...")
try:
    response = requests.get("https://www.google.com", timeout=5)
    print(f"✓ Google reachable: {response.status_code}")
except Exception as e:
    print(f"✗ Google not reachable: {e}")

# Test Hugging Face main site
print("\nTesting Hugging Face main site...")
try:
    response = requests.get("https://huggingface.co", timeout=5)
    print(f"✓ Hugging Face reachable: {response.status_code}")
except Exception as e:
    print(f"✗ Hugging Face not reachable: {e}")

# Test DNS resolution for API endpoint
print("\nTesting DNS resolution for api-inference.huggingface.co...")
try:
    ip = socket.gethostbyname("api-inference.huggingface.co")
    print(f"✓ DNS resolved: {ip}")
except socket.gaierror as e:
    print(f"✗ DNS resolution failed: {e}")

# Test direct API endpoint
print("\nTesting direct API endpoint...")
try:
    response = requests.get("https://api-inference.huggingface.co", timeout=5)
    print(f"✓ API endpoint reachable: {response.status_code}")
except Exception as e:
    print(f"✗ API endpoint not reachable: {e}")

# Try alternative endpoint
print("\nTesting alternative endpoint (huggingface.co/models)...")
try:
    response = requests.get("https://huggingface.co/models", timeout=5)
    print(f"✓ Models page reachable: {response.status_code}")
except Exception as e:
    print(f"✗ Models page not reachable: {e}")
