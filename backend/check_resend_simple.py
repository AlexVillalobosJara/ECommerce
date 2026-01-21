
import os
import django
import sys

# Setup settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.conf import settings
import resend

print(f"API KEY: {settings.RESEND_API_KEY[:5]}...")
print(f"FROM: {settings.DEFAULT_FROM_EMAIL}")

try:
    params = {
        "from": "Zumi Store <onboarding@resend.dev>",
        "to": "test_random_user_123@example.com", 
        "subject": "Test Email",
        "html": "<p>Test</p>"
    }
    print("Attempting to send to random email...")
    r = resend.Emails.send(params)
    print(f"Success: {r}")
except Exception as e:
    print(f"ERROR: {e}")
