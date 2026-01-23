import csv

def analyze(filename):
    print(f"\n{'='*20} {filename} {'='*20}")
    with open(filename, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        total_calls = 0
        total_rows = 0
        role_stats = {}
        queries = []
        
        for row in reader:
            try:
                calls = int(row['calls'])
                rows = int(row['rows_read'])
                role = row['rolname']
                
                total_calls += calls
                total_rows += rows
                
                if role not in role_stats:
                    role_stats[role] = {'calls': 0, 'rows': 0}
                role_stats[role]['calls'] += calls
                role_stats[role]['rows'] += rows
                
                # Store numeric values for sorting
                row['calls_int'] = calls
                row['rows_int'] = rows
                queries.append(row)
            except:
                continue
            
        print(f"Total Calls: {total_calls:,}")
        print(f"Total Rows Read: {total_rows:,}")
        print("\nStats by Role:")
        for role, stats in role_stats.items():
            print(f"  - {role:15}: {stats['calls']:10,} calls | {stats['rows']:12,} rows")
            
        print("\nTop 3 Queries by Calls:")
        queries.sort(key=lambda x: x['calls_int'], reverse=True)
        for q in queries[:3]:
            print(f"  [{q['rolname']}] {q['calls_int']:,} calls | {q['query'][:80].replace(chr(10), ' ')}...")

        print("\nTop 3 Queries by Rows Read:")
        queries.sort(key=lambda x: x['rows_int'], reverse=True)
        for q in queries[:3]:
            print(f"  [{q['rolname']}] {q['rows_int']:,} rows | {q['query'][:80].replace(chr(10), ' ')}...")

analyze('D:/source/reposV2026/ecommerce/paso/Supabase Query Performance 1.csv')
analyze('D:/source/reposV2026/ecommerce/paso/Supabase Query Performance 2.csv')
