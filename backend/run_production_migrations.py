import os
import django
import urllib.parse
from django.core.management import call_command

# Set up Supabase connection
# IMPORTANT: Use the pooler URL for migrations to avoid connection limits
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

def run_migrations():
    print("Starting production database migration...")
    try:
        call_command('migrate', interactive=False)
        print("\nSUCCESS: All migrations applied to production.")
    except Exception as e:
        print(f"\nERROR during migration: {e}")

if __name__ == "__main__":
    run_migrations()
