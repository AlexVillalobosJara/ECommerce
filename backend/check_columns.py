from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders_order'
        ORDER BY ordinal_position;
    """)
    columns = cursor.fetchall()
    print("\nColumnas en la tabla orders_order:")
    for col in columns:
        print(f"  - {col[0]}")
