import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def list_tenants():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT id, name, slug, status, deleted_at FROM tenants")
    rows = cur.fetchall()
    print(f"Total tenants: {len(rows)}")
    for r in rows:
        print(f" - ID: {r[0]}, Name: {r[1]}, Slug: [{r[2]}], Status: {r[3]}, Deleted: {r[4]}")
    cur.close()
    conn.close()

if __name__ == "__main__":
    list_tenants()
