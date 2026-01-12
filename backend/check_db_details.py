import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def inspect_details():
    print("=== Inspección de Detalles (Tipos e Identidades) ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Where is discount_type used?
        print("\nColumnas usando 'discount_type':")
        cur.execute("""
            SELECT table_name, column_name 
            FROM information_schema.columns 
            WHERE udt_name = 'discount_type' AND table_schema = 'public'
        """)
        for row in cur.fetchall():
            print(f" - {row[0]}.{row[1]}")

        # 2. Check for IDENTITY columns in tenants
        print("\nIdentidades en 'tenants':")
        cur.execute("""
            SELECT column_name, is_identity, identity_generation
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tenants'
            AND is_identity = 'YES'
        """)
        for row in cur.fetchall():
            print(f" - {row[0]}: {row[2]}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    inspect_details()
