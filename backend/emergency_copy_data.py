import os
import django
import urllib.parse
from django.db import connection, transaction

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def emergency_copy():
    print("=== Iniciando Copia de Datos de Emergencia ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    entities = [
        'tenants', 'auth_user', 'tenant_users', 'products', 'categories', 
        'product_variants', 'customers', 'shipping_zones'
    ]
    
    with connection.cursor() as cursor:
        # Check source first
        cursor.execute("SELECT count(*) FROM public.tenants")
        p_count = cursor.fetchone()[0]
        print(f"   -> Verificación origen: public.tenants tiene {p_count} filas.")
        
        if p_count == 0:
            print("   -> ABORTANDO: El esquema público parece vacío.")
            return

        for table in entities:
            try:
                print(f"   -> Copiando {table}...")
                with transaction.atomic():
                    # Use explicit schema prefixes
                    cursor.execute(f"TRUNCATE TABLE test.{table} RESTART IDENTITY CASCADE")
                    cursor.execute(f"INSERT INTO test.{table} SELECT * FROM public.{table}")
                    count = cursor.rowcount
                    print(f"      OK: {count} filas migradas a test.{table}")
            except Exception as e:
                print(f"      ERROR en {table}: {e}")

    print("\n=== Proceso de Emergencia Finalizado ===")

if __name__ == "__main__":
    emergency_copy()
