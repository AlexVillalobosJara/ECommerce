"""
Test the new API key
"""
import requests

api_key = "sk-85b9654cd4864ee5b769c63381996b27"
api_url = "https://api.deepseek.com/v1/chat/completions"

print(f"Testing API key: {api_key[:20]}...")

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

payload = {
    "model": "deepseek-chat",
    "messages": [
        {"role": "user", "content": "Say hello in Spanish"}
    ],
    "max_tokens": 20
}

try:
    response = requests.post(api_url, headers=headers, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        content = result['choices'][0]['message']['content']
        print(f"✓ API key is VALID!")
        print(f"Response: {content}")
    else:
        print(f"✗ API key FAILED")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
