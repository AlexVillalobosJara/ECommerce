import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def list_tables():
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'test' ORDER BY table_name")
        tables = cursor.fetchall()
        print(f"Total tables in 'test': {len(tables)}")
        for t in tables:
            print(t[0])

if __name__ == "__main__":
    list_tables()
