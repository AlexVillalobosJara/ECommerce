
import os
import django
import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from rest_framework import serializers
from orders.serializers_phase4 import QuoteResponseSerializer

def test_view_logic():
    print("Testing Quote Response View Logic...")

    # Mock Frontend Payload (from adminOrderService.ts)
    # body: JSON.stringify(quoteData)
    # quoteData: { quote_items: Record<string, string>, quote_valid_until: string, internal_notes: string }
    
    frontend_payload = {
        "quote_items": {
            "00000000-0000-0000-0000-000000000001": "50000.00",
            "00000000-0000-0000-0000-000000000002": "15990"
        },
        "quote_valid_until": (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
        "internal_notes": "Test notes from simulation"
    }
    
    print(f"Payload: {frontend_payload}")
    
    serializer = QuoteResponseSerializer(data=frontend_payload)
    is_valid = serializer.is_valid()
    
    if is_valid:
        print("VALIDATION SUCCESS")
        print("Validated Data:", serializer.validated_data)
    else:
        print("VALIDATION FAILURE")
        print("Errors:", serializer.errors)
        
    if is_valid:
        validated_data = serializer.validated_data
        items = validated_data['quote_items']
        print(f"Items type: {type(items)}")
        # Check if keys are strings (DictField keys are usually strings)
        for k, v in items.items():
            print(f"Key: {k} ({type(k)}), Value: {v} ({type(v)})")

if __name__ == "__main__":
    test_view_logic()
