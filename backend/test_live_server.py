
import requests
import json

def test_live_server():
    url = "http://127.0.0.1:8000/api/storefront/payments/initiate/?tenant=demo-store"
    payload = {
        "order_id": "invalid-uuid",
        "gateway": "Flow"
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        print(f"Requesting {url}...")
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        
        if 'text/html' in response.headers.get('Content-Type', ''):
            print("--- HTML RESPONSE RECEIVED ---")
            print(response.text[:1000])
        else:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_live_server()
