import requests
import json

# Test the payment initiation endpoint directly
url = "http://localhost:8000/api/storefront/payments/initiate/?tenant=demo-store"

data = {
    "order_id": "4b0cd34e-5799-4b84-b910-973f6e036da3",
    "gateway": "Flow",
    "return_url": "http://localhost:3000/payment/callback",
    "cancel_url": "http://localhost:3000/payment/cancelled"
}

print(f"Making request to: {url}")
print(f"Data: {json.dumps(data, indent=2)}")

try:
    response = requests.post(url, json=data, timeout=30)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✅ SUCCESS!")
        print(f"Payment URL: {result.get('payment_url')}")
    else:
        print(f"\n❌ FAILED")
        try:
            error = response.json()
            print(f"Error: {json.dumps(error, indent=2)}")
        except:
            pass
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")
    import traceback
    traceback.print_exc()
