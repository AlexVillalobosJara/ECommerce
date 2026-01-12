import psycopg2
import urllib.parse
import os

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def direct_copy():
    print("=== Copia Directa con Psycopg2 ===")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = False # Transaction control
        cur = conn.cursor()
        
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
        
        # Disable constraints
        print("   -> Desactivando triggers/FKs...")
        cur.execute("SET session_replication_role = replica")
        
        for table in entities:
            try:
                print(f"   -> Copiando {table}...")
                # Full namespacing
                cur.execute(f"TRUNCATE TABLE test.{table} RESTART IDENTITY CASCADE")
                cur.execute(f"INSERT INTO test.{table} SELECT * FROM public.{table}")
                print(f"      OK: {cur.rowcount} filas.")
            except Exception as e:
                print(f"      ERROR en {table}: {e}")
                raise e # Fail whole transaction
        
        print("   -> Reactivando triggers/FKs...")
        cur.execute("SET session_replication_role = origin")
        
        conn.commit()
        print("\n=== CLONACIÓN EXITOSA ===")
        
    except Exception as e:
        print(f"\n=== FALLO CRÍTICO: {e} ===")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    direct_copy()
