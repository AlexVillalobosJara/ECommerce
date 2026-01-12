import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def check_data():
    print("=== Comprobación de Datos Final ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    with connection.cursor() as cursor:
        results = {}
        for table in ['tenants', 'auth_user', 'products']:
            try:
                cursor.execute(f"SELECT count(*) FROM test.{table}")
                results[table] = cursor.fetchone()[0]
            except Exception as e:
                results[table] = f"Error: {e}"
        
        print(f"Resultados en 'test':")
        for table, count in results.items():
            print(f" - {table}: {count} filas")
            
        if results.get('tenants', 0) > 0:
            cursor.execute("SELECT slug FROM test.tenants")
            slugs = [r[0] for r in cursor.fetchall()]
            print(f" - Slugs detectados: {', '.join(slugs)}")

if __name__ == "__main__":
    check_data()
