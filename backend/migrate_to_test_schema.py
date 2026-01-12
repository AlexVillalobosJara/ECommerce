import os
import django
import urllib.parse
from django.core.management import call_command
from django.db import connection, connections
from django.db.backends.signals import connection_created
from django.dispatch import receiver

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
# DIRECT CONNECTION to bypass pooler issues
db_url_direct = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@db.ztwtkwvgxavwwyvdzibz.supabase.co:5432/postgres'

@receiver(connection_created)
def setup_search_path(connection, **kwargs):
    if connection.alias == 'default':
        with connection.cursor() as cursor:
            cursor.execute("SET search_path TO test")

def run_migration():
    print("=== Migración al Esquema 'test' (V4 - Direct Connection) ===")
    
    os.environ['DATABASE_URL'] = db_url_direct
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    
    django.setup()
    
    # 1. Migraciones (Estructura)
    print("\n1. Aplicando estructura...")
    try:
        call_command('migrate', interactive=False, verbosity=1)
        print("   -> Estructura lista.")
    except Exception as e:
        print(f"   -> Error en estructura: {e}")
        return

    # 2. Datos (Copia Explícita)
    print("\n2. Copiando datos (Explícito public -> test)...")
    entities = [
        'tenants', 'auth_user', 'tenant_users', 'products', 'categories', 
        'product_variants', 'customers', 'shipping_zones'
    ]
    
    with connection.cursor() as cursor:
        for table in entities:
            try:
                print(f"   -> Copiando {table}...")
                # Truncate clean
                cursor.execute(f"TRUNCATE TABLE test.{table} RESTART IDENTITY CASCADE")
                # Insert explicitly from public to test
                cursor.execute(f"INSERT INTO test.{table} SELECT * FROM public.{table}")
                print(f"      OK: Copiados items en {table}")
            except Exception as e:
                print(f"      ERROR en {table}: {e}")
                connection.rollback()
            else:
                connection.commit()

    print("\n=== Migración Finalizada ===")

if __name__ == "__main__":
    run_migration()
