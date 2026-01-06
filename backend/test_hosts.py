
import requests

def test_hosts():
    url = "http://127.0.0.1:8000/api/storefront/payments/initiate/?tenant=demo-store"
    hosts = [
        "localhost:8000",
        "127.0.0.1:8000",
        "example.com",
        "demo-store.localhost:8000"
    ]
    
    for host in hosts:
        print(f"\nTesting Host: {host}")
        try:
            response = requests.post(
                url, 
                headers={"Host": host, "Content-Type": "application/json"},
                json={"order_id": "invalid"},
                timeout=5
            )
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('Content-Type')}")
            if "text/html" in response.headers.get('Content-Type', ''):
                print("HTML Detected")
                print(response.text[:200])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_hosts()
