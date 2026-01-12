import os
import django
import urllib.parse
from django.db import connection

# Credentials
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def diagnose():
    print("=== Diagnóstico de Esquemas ===")
    os.environ['DATABASE_URL'] = db_url
    os.environ['RENDER'] = 'true'
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
    django.setup()
    
    with connection.cursor() as cursor:
        # 1. Ver esquemas existentes
        cursor.execute("SELECT schema_name FROM information_schema.schemata")
        schemas = [s[0] for s in cursor.fetchall()]
        print(f"Esquemas en la DB: {', '.join(schemas)}")
        
        if 'test' in schemas:
            print("   -> El esquema 'test' EXISTE.")
        else:
            print("   -> El esquema 'test' NO EXISTE.")
            
        # 2. Ver usuario actual
        cursor.execute("SELECT current_user")
        print(f"Usuario actual: {cursor.fetchone()[0]}")
        
        # 3. Intentar crear tabla manualmente en test
        if 'test' in schemas:
            try:
                print("\nIntentando crear tabla de prueba en 'test'...")
                cursor.execute("CREATE TABLE test.debug_connection (id serial primary key, message text)")
                cursor.execute("INSERT INTO test.debug_connection (message) VALUES ('Conexión verificada')")
                connection.commit()
                print("   -> Tabla 'debug_connection' creada con éxito.")
                
                cursor.execute("SELECT * FROM test.debug_connection")
                print(f"   -> Lectura de prueba: {cursor.fetchone()}")
            except Exception as e:
                print(f"   -> Error creando tabla: {e}")
                connection.rollback()
        
        # 4. Ver tablas en test de nuevo
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'test'")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"\nTablas finales en 'test': {', '.join(tables)}")

if __name__ == "__main__":
    diagnose()
