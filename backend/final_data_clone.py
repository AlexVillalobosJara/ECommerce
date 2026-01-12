import os
import django
import urllib.parse
from django.db import connection, transaction

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def final_clone():
    print("=== Clonando Datos (Protocolo Final - Replica Mode) ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    # Improved order for clarity (though replica mode should handle any order)
    entities = [
        'auth_user',
        'tenants',
        'tenant_users',
        'categories',
        'products',
        'product_variants',
        'customers',
        'shipping_zones'
    ]
    
    with connection.cursor() as cursor:
        try:
            # Atomic block to ensure everything or nothing
            with transaction.atomic():
                print("   -> Paso 1: Intentando desactivar restricciones...")
                try:
                    cursor.execute("SET session_replication_role = replica")
                    print("      [OK] session_replication_role = replica")
                except Exception as e:
                    print(f"      [AVISO] No se pudo setear replica mode (permisos?): {e}")
                    print("      Continuando con limpieza manual CASCADE...")
                
                for table in entities:
                    try:
                        print(f"   -> Paso 2.{entities.index(table)+1}: Copiando {table}...")
                        # TRUNCATE CASCADE to be absolutely sure
                        cursor.execute(f"TRUNCATE TABLE test.{table} RESTART IDENTITY CASCADE")
                        cursor.execute(f"INSERT INTO test.{table} SELECT * FROM public.{table}")
                        count = cursor.rowcount
                        print(f"      -> Éxito: {count} filas copiadas.")
                    except Exception as inner_e:
                        print(f"      -> ERROR en {table}: {inner_e}")
                        raise inner_e # Break atomic block
                
                print("   -> Paso 3: Re-activando restricciones...")
                cursor.execute("SET session_replication_role = origin")
                
            print("\n=== CLONACIÓN COMPLETADA CON ÉXITO ===")
            
        except Exception as e:
            print(f"\n=== PROCESO FALLIDO: {e} ===")
            # rollback is automatic with transaction.atomic()

if __name__ == "__main__":
    final_clone()
