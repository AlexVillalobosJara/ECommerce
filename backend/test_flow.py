import requests
import hmac
import hashlib

# Credentials from admin
api_key = '24FB0EA5-07C6-4EEE-A4BD-378LFC91967D'
secret_key = '88d0f3c915ae59e5912476428d1dd4d59fd06ba'

# Test parameters
params = {
    'amount': '15000',
    'apiKey': api_key,
    'commerceOrder': 'TEST-FINAL-001',
    'currency': 'CLP',
    'email': 'test@gmail.com',
    'subject': 'Test Order Final',
    'urlConfirmation': 'http://localhost:8000/api/storefront/payments/callback/Flow/?tenant=demo-store',
    'urlReturn': 'http://localhost:3000/payment/callback',
}

# Create signature (Flow format: keyvalue concatenated)
sorted_params = sorted(params.items())
params_string = ''.join([f"{k}{v}" for k, v in sorted_params])

print(f"String to sign: {params_string}\n")

signature = hmac.new(
    secret_key.encode('utf-8'),
    params_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

params['s'] = signature

print(f"Signature: {signature}\n")
print(f"Making request to: https://sandbox.flow.cl/api/payment/create\n")

# Make request
response = requests.post(
    'https://sandbox.flow.cl/api/payment/create',
    data=params,
    timeout=10
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    result = response.json()
    print(f"\n✅ SUCCESS!")
    print(f"Payment URL: {result.get('url')}?token={result.get('token')}")
else:
    print(f"\n❌ FAILED")
    try:
        error = response.json()
        print(f"Error Code: {error.get('code')}")
        print(f"Error Message: {error.get('message')}")
    except:
        pass
