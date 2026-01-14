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

def audit_tables():
    print("Auditing tables in public schema...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        rows = cursor.fetchall()
        with open('table_audit.txt', 'w', encoding='utf-8') as f:
            for row in rows:
                f.write(f"{row[0]}\n")
    print("Done. See table_audit.txt")

if __name__ == "__main__":
    audit_tables()
