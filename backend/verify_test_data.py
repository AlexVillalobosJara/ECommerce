import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def verify_data():
    print("=== Verificación de Datos en 'test' ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    entities = ['tenants', 'auth_user', 'products', 'categories', 'tenant_users']
    
    with connection.cursor() as cursor:
        for table in entities:
            try:
                cursor.execute(f"SELECT count(*) FROM test.{table}")
                count = cursor.fetchone()[0]
                print(f"   -> Tabla test.{table}: {count} filas.")
            except Exception as e:
                print(f"   -> Error leyendo test.{table}: {e}")

if __name__ == "__main__":
    verify_data()
