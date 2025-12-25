
import os
import django
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.conf import settings
import resend

def test_send_email():
    print("Testing Email Sending...")
    print(f"API Key present: {bool(settings.RESEND_API_KEY)}")
    print(f"From: {settings.DEFAULT_FROM_EMAIL}")
    print(f"To: {settings.ADMIN_EMAIL}")

    resend.api_key = settings.RESEND_API_KEY

    params = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": settings.ADMIN_EMAIL,
        "subject": "🧪 Test Email from Antigravity",
        "html": "<h1>It Works!</h1><p>If you see this, email sending is working correctly.</p>",
    }

    try:
        response = resend.Emails.send(params)
        print("Response:", response)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_send_email()
