import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def verify():
    print("=== Verificando Esquema 'test' ===")
    os.environ['DATABASE_URL'] = f"{db_url}?options=-csearch_path%3Dtest"
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    with connection.cursor() as cursor:
        # Check current search_path
        cursor.execute("SHOW search_path")
        print(f"Current search_path: {cursor.fetchone()[0]}")
        
        # Check tables in test schema
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'test'")
        tables = cursor.fetchall()
        print(f"\nTablas encontradas en esquema 'test' ({len(tables)}):")
        for t in tables:
            print(f" - {t[0]}")
            
        # Check if any tables have data
        if tables:
            table_name = tables[0][0]
            try:
                cursor.execute(f"SELECT count(*) FROM test.{table_name}")
                count = cursor.fetchone()[0]
                print(f"\nEjemplo: Tabla '{table_name}' tiene {count} registros.")
            except Exception as e:
                print(f"Error al contar registros en {table_name}: {e}")

if __name__ == "__main__":
    verify()
