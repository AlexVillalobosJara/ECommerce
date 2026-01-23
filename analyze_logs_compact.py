import csv

def analyze(filename):
    print(f"\n--- {filename} ---")
    with open(filename, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        total_calls = 0
        total_rows = 0
        role_stats = {}
        queries = []
        for row in reader:
            try:
                c, r, role = int(row['calls']), int(row['rows_read']), row['rolname']
                total_calls += c
                total_rows += r
                if role not in role_stats: role_stats[role] = {'c': 0, 'r': 0}
                role_stats[role]['c'] += c
                role_stats[role]['r'] += r
                row['c_int'], row['r_int'] = c, r
                queries.append(row)
            except: continue
        print(f"Calls: {total_calls}, Rows: {total_rows}")
        for role, s in role_stats.items():
            print(f"Role {role}: {s['c']} calls, {s['r']} rows")
        queries.sort(key=lambda x: x['r_int'], reverse=True)
        print("Top 3 by Rows Read:")
        for q in queries[:3]:
            txt = q['query'][:80].replace('\n', ' ')
            print(f"  {q['rolname']} | {q['r_int']} rows | {txt}")

analyze('D:/source/reposV2026/ecommerce/paso/Supabase Query Performance 1.csv')
analyze('D:/source/reposV2026/ecommerce/paso/Supabase Query Performance 2.csv')
