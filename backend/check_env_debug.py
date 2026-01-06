
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.conf import settings

def check():
    print(f"DEBUG: {settings.DEBUG}")
    print(f"ENCRYPTION_KEY length: {len(getattr(settings, 'ENCRYPTION_KEY', ''))}")
    print(f"DATABASE_URL present: {bool(os.environ.get('DATABASE_URL'))}")
    print(f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"FRONTEND_URL: {settings.FRONTEND_URL}")
    print(f"MIDDLEWARE count: {len(settings.MIDDLEWARE)}")
    for m in settings.MIDDLEWARE:
        print(f"  - {m}")

if __name__ == "__main__":
    check()
