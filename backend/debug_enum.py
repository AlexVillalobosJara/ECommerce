import os
import django
import sys

sys.path.append(r"d:\source\reposV2026\ecommerce\backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT enum_range(NULL::discount_type)")
    print(cursor.fetchone()[0])
