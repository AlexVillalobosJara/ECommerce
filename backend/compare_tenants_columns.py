import psycopg2
import urllib.parse

password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

def compare_columns():
    print("=== Comparando Columnas de 'tenants' (public vs test) ===")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        def get_columns(schema, table):
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_schema = '{schema}' AND table_name = '{table}'
                ORDER BY column_name
            """)
            return {row[0]: (row[1], row[2]) for row in cur.fetchall()}

        public_cols = get_columns('public', 'tenants')
        test_cols = get_columns('test', 'tenants')
        
        print(f"Colmumnas en public: {len(public_cols)}")
        print(f"Columnas en test: {len(test_cols)}")
        
        missing_in_test = set(public_cols.keys()) - set(test_cols.keys())
        extra_in_test = set(test_cols.keys()) - set(public_cols.keys())
        
        print(f"\nColumnas faltantes en 'test.tenants':")
        for col in sorted(missing_in_test):
            print(f" - {col}: {public_cols[col]}")
            
        print(f"\nColumnas extra en 'test.tenants':")
        for col in sorted(extra_in_test):
            print(f" - {col}: {test_cols[col]}")
            
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    compare_columns()
