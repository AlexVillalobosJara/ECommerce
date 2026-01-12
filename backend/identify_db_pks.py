import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def identify_pks():
    print("=== Identificación de PKs y Secuencias ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                column_name, 
                is_identity, 
                identity_generation, 
                column_default, 
                table_name
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND (is_identity = 'YES' OR column_default LIKE 'nextval%')
        """)
        rows = cur.fetchall()
        print(f"Columnas con Secuencia/Identidad: {len(rows)}")
        for r in rows:
            print(f" - {r[4]}.{r[0]}: Identity={r[1]}, Gen={r[2]}, Default={r[3]}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    identify_pks()
