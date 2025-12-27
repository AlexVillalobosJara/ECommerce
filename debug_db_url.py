
import os
import dj_database_url

url = 'postgresql://postgres:$$kairos01%%@db.ztwtkwvgxavwwyvdzibz.supabase.co:5432/postgres'
print(f"Original URL: {url}")
config = dj_database_url.parse(url)
print(f"Parsed Config: {config}")
