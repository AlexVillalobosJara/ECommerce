import os
import django
import urllib.parse
from django.db import connection

# Set up Supabase connection
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

def check_tenants():
    with connection.cursor() as cursor:
        cursor.execute("SELECT id, name, slug, custom_domain FROM tenants")
        rows = cursor.fetchall()
        print(f"{'ID':<40} | {'Name':<20} | {'Slug':<20} | {'Custom Domain':<30}")
        print("-" * 120)
        for row in rows:
            print(f"{str(row[0]):<40} | {row[1]:<20} | {row[2]:<20} | {str(row[3]):<30}")

if __name__ == "__main__":
    check_tenants()
