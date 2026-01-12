import psycopg2
import urllib.parse
import os

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def inspect():
    print("=== Inspección de Nombres Exactos ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Search for tenants-like tables
        cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name ILIKE '%tenant%'")
        rows = cur.fetchall()
        for row in rows:
            # We print them between brackets to see spaces or weird chars
            print(f"Encontrado: Schema=[{row[0]}], Name=[{row[1]}]")
            
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    inspect()
