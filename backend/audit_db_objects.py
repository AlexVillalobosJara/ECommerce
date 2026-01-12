import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def audit_objects():
    print("=== Auditoría de Objetos en 'public' ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # 1. Sequences
        cur.execute("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'")
        sequences = cur.fetchall()
        print(f"\nSequencias ({len(sequences)}):")
        for s in sequences:
            print(f" - {s[0]}")
            
        # 2. Types (Enums, etc)
        cur.execute("""
            SELECT n.nspname as schema, t.typname as type_name
            FROM pg_type t
            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid))
            AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
            AND n.nspname = 'public'
            AND t.typname NOT IN ('int2', 'int4', 'int8', 'float4', 'float8', 'numeric', 'text', 'varchar', 'bool', 'date', 'timestamp', 'timestamptz', 'interval', 'uuid', 'json', 'jsonb')
        """)
        types = cur.fetchall()
        print(f"\nTipos Personalizados ({len(types)}):")
        for t in types:
            print(f" - {t[1]}")

        # 3. Triggers
        cur.execute("SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public'")
        triggers = cur.fetchall()
        print(f"\nTriggers ({len(triggers)}):")
        for tr in triggers:
            print(f" - {tr[0]} on {tr[1]}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    audit_objects()
