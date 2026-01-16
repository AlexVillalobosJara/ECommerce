"""
Test Google Gemini API key
"""
import requests
import json

api_key = "AIzaSyBD88ZlMbAfLor-OtCQN9-fG09vFoPhkQQ"
api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"

print(f"Testing Gemini API key...")

headers = {
    "Content-Type": "application/json"
}

payload = {
    "contents": [{
        "parts": [{
            "text": "Di 'Hola' en español"
        }]
    }]
}

try:
    response = requests.post(api_url, headers=headers, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        content = result['candidates'][0]['content']['parts'][0]['text']
        print(f"✓ Gemini API is WORKING!")
        print(f"Response: {content}")
    else:
        print(f"✗ API FAILED")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"✗ ERROR: {e}")
