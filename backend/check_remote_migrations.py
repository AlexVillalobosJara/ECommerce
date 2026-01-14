import os
import django
import urllib.parse
from django.db import connection
from django.db.migrations.loader import MigrationLoader

# Set up Supabase connection
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

def audit_migrations():
    print("Auditing migrations on production database...")
    loader = MigrationLoader(connection, ignore_no_migrations=True)
    applied_migrations = loader.applied_migrations
    unapplied = []
    
    for app_migration in loader.graph.nodes:
        if app_migration not in applied_migrations:
            unapplied.append(app_migration)
    
    with open('migration_audit.txt', 'w') as f:
        if not unapplied:
            f.write("All migrations are already applied in production.\n")
            print("All migrations are already applied in production.")
        else:
            f.write(f"Found {len(unapplied)} unapplied migrations:\n")
            unapplied.sort()
            for app, name in unapplied:
                f.write(f" - {app}: {name}\n")
            print(f"Audit complete. Found {len(unapplied)} migrations. See migration_audit.txt")

if __name__ == "__main__":
    audit_migrations()
