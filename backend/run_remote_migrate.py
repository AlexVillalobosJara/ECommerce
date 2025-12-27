
import os
import sys
import urllib.parse
from django.core.management import execute_from_command_line

# Encode the password
password = urllib.parse.quote_plus('$$kairos01%%')
# New URL format from user: postgresql://postgres.ztwtkwvgxavwwyvdzibz:$$kairos01%%@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
# We need to construct this carefully.
# User: postgres.ztwtkwvgxavwwyvdzibz
# Host: aws-1-sa-east-1.pooler.supabase.com
# Port: 6543
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

# Set environment variables for the process
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true' # To force production settings (DEBUG=False, etc) - wait, settings.py logic relies on this

# Add project root to path
sys.path.append(os.getcwd())
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

import django
from django.core.management import call_command

if __name__ == '__main__':
    print(f"Connecting to: {db_url.replace(password, '******')}")
    django.setup()
    
    # 1. Fake orders if it's causing issues (since table exists)
    print("1. Faking 'orders' migration...")
    try:
        call_command('migrate', 'orders', fake=True)
        print("   -> Orders faked.")
    except Exception as e:
        print(f"   -> Warning: Could not fake orders: {e}")

    # 2. Ensure sessions is migrated
    print("2. Migrating 'sessions'...")
    try:
        call_command('migrate', 'sessions')
        print("   -> Sessions migrated.")
    except Exception as e:
        print(f"   -> Error migrating sessions: {e}")

    # 3. Run full migrate for everything else
    print("3. Running remaining migrations...")
    try:
        call_command('migrate', '--fake-initial')
    except Exception as e:
        print(f"   -> Migration finished with possible errors (check if critical): {e}")
