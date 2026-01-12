import psycopg2
import urllib.parse
import os

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def check_visibility():
    print("=== Comprobando Visibilidad en Public ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        for table in ['auth_user', 'tenants', 'tenant_users']:
            try:
                cur.execute(f"SELECT count(*) FROM public.{table}")
                print(f" - public.{table}: {cur.fetchone()[0]} filas")
            except Exception as e:
                print(f" - Error public.{table}: {e}")
                conn.rollback()
        
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    check_visibility()
