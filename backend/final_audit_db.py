import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def final_audit():
    print("=== Auditoría Final de Schema ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Views
        cur.execute("SELECT table_name FROM information_schema.views WHERE table_schema = 'public'")
        views = cur.fetchall()
        print(f"Views: {len(views)}")
        for v in views: print(f" - {v[0]}")
        
        # 2. Constraints (Check)
        cur.execute("""
            SELECT tc.table_name, c.column_name, cc.check_clause
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage cu ON cu.constraint_name = tc.constraint_name
            JOIN information_schema.columns c ON c.table_name = tc.table_name AND c.column_name = cu.column_name
            JOIN information_schema.check_constraints cc ON cc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
        """)
        checks = cur.fetchall()
        print(f"Check Constraints: {len(checks)}")
        
        # 3. Tables count
        cur.execute("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
        print(f"Base Tables: {cur.fetchone()[0]}")
        
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    final_audit()
