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

def run_backup():
    print("Executing backup from public to test schema...")
    try:
        with open('backup_to_test.sql', 'r') as f:
            sql = f.read()
            
        with connection.cursor() as cursor:
            # We need to execute multiple statements. Django's cursor.execute 
            # might only support one at a time depending on the backend, 
            # but usually it works fine for plain SQL. 
            # If it fails, we split by semicolon.
            cursor.execute(sql)
            print("\nSUCCESS: Backup completed. Summary:")
            
            # Fetch summary (from the last SELECT in the script)
            rows = cursor.fetchall()
            print(f"{'Table':<20} | {'Row Count':<10}")
            print("-" * 35)
            for row in rows:
                print(f"{row[0]:<20} | {row[1]:<10}")
                
    except Exception as e:
        print(f"\nERROR during backup: {e}")

if __name__ == "__main__":
    run_backup()
