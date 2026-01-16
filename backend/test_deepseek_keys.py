"""
Test script to verify DeepSeek API keys
"""
import os
import requests

# Test both keys
keys = [
    ('PRIMARY', 'bb6dffbbc4104c47be3cbb28df986a6e'),
    ('FALLBACK', 'sk-7149bc0dc4f64d6eba546f549789c036')
]

api_url = "https://api.deepseek.com/v1/chat/completions"

for key_name, api_key in keys:
    print(f"\nTesting {key_name} key: {api_key[:20]}...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": "Say hello"}
        ],
        "max_tokens": 10
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:200]}")
        
        if response.status_code == 200:
            print(f"✓ {key_name} key is VALID")
        else:
            print(f"✗ {key_name} key FAILED")
            
    except Exception as e:
        print(f"✗ {key_name} key ERROR: {e}")
