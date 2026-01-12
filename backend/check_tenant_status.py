import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def check():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT slug, status, deleted_at FROM tenants WHERE slug = 'doctorinox'")
    row = cur.fetchone()
    print(f"Resultado: {row}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    check()
