import psycopg2
import urllib.parse
import os

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def locate():
    print("=== Localizando Tabla 'tenants' ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("SELECT table_schema, table_name, table_type FROM information_schema.tables WHERE table_name = 'tenants'")
        rows = cur.fetchall()
        print(f"Ocurrencias de la tabla 'tenants':")
        for row in rows:
            print(f" - Schema: {row[0]}, Name: {row[1]}, Type: {row[2]}")
            
        cur.execute("SELECT current_user")
        print(f"Usuario actual: {cur.fetchone()[0]}")
        
        cur.execute("SHOW search_path")
        print(f"Search path: {cur.fetchone()[0]}")
        
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    locate()
