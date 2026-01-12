import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def last_chance():
    print("=== Último Intento: Copia de 'tenants' ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Comprobar que existe de nuevo
        cur.execute("SELECT count(*) FROM public.tenants")
        print(f" - Lectura directa public.tenants: {cur.fetchone()[0]} filas")
        
        # 2. Intentar copiar con search_path
        print(" - Intentando copia vía INSERT INTO test.tenants SELECT * FROM public.tenants...")
        cur.execute("SET session_replication_role = replica")
        cur.execute("TRUNCATE TABLE test.tenants RESTART IDENTITY CASCADE")
        cur.execute("INSERT INTO test.tenants SELECT * FROM public.tenants")
        print(f"   -> Éxito parcial: {cur.rowcount} filas.")
        
        conn.commit()
    except Exception as e:
        print(f" - FALLO: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    last_chance()
