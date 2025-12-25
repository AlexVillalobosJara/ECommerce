import requests
import json

url = "http://localhost:8000/api/admin/auth/login/"
data = {
    "username": "admin",
    "password": "admin123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    if response.status_code == 200:
        print("\n✅ Login successful!")
        data = response.json()
        print(f"Access Token: {data.get('access', 'N/A')[:50]}...")
        print(f"Refresh Token: {data.get('refresh', 'N/A')[:50]}...")
    else:
        print(f"\n❌ Login failed!")
except Exception as e:
    print(f"Error: {e}")
