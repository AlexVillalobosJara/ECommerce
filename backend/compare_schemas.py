import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def compare():
    print("=== Comparando public vs test ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT current_database()")
        print(f"Base de datos: {cursor.fetchone()[0]}")
        
        for table in ['tenants', 'auth_user', 'products']:
            print(f"\nRevisando tabla: {table}")
            try:
                cursor.execute(f"SELECT count(*) FROM public.{table}")
                p_count = cursor.fetchone()[0]
                print(f"   -> public.{table}: {p_count} filas")
            except Exception as e:
                print(f"   -> Error public.{table}: {e}")
                
            try:
                cursor.execute(f"SELECT count(*) FROM test.{table}")
                t_count = cursor.fetchone()[0]
                print(f"   -> test.{table}: {t_count} filas")
            except Exception as e:
                print(f"   -> Error test.{table}: {e}")

if __name__ == "__main__":
    compare()
