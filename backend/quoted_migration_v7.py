import psycopg2
import urllib.parse
import os

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def quoted_copy():
    print("=== Migración V7 (Quoted Protocol - Fixed) ===")
    try:
        conn = psycopg2.connect(db_url)
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
        
        # Disable restrictions
        cur.execute("SET session_replication_role = replica")
        
        for table in entities:
            try:
                print(f"   -> Procesando \"{table}\"...")
                # Use quotes for BOTH schemas and table
                sql = f"TRUNCATE TABLE \"test\".\"{table}\" RESTART IDENTITY CASCADE"
                cur.execute(sql)
                sql_insert = f"INSERT INTO \"test\".\"{table}\" SELECT * FROM \"public\".\"{table}\""
                cur.execute(sql_insert)
                print(f"      OK: {cur.rowcount} filas copiadas.")
            except Exception as e:
                print(f"      ERROR en {table}: {e}")
                conn.rollback()
                raise e
        
        cur.execute("SET session_replication_role = origin")
        conn.commit()
        print("\n=== CLONACIÓN V7 EXITOSA ===")
        
    except Exception as e:
        print(f"\n=== FALLO V7: {e} ===")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    quoted_copy()
