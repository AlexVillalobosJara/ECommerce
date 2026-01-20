
import requests
import json

url = "http://localhost:8000/api/storefront/home-data/?slug=autotest"
try:
    print(f"Fetching from: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        tenant = data.get('tenant', {})
        print(f"Tenant: {tenant.get('name')}")
        print(f"Shipping Workdays: {tenant.get('shipping_workdays')}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
