
import os
import sys
import urllib.parse
from django.core.management import execute_from_command_line

# Encode the password
password = urllib.parse.quote_plus('$$kairos01%%')
# New URL format from user: postgresql://postgres.ztwtkwvgxavwwyvdzibz:$$kairos01%%@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

# Set environment variables for the process
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'

# Add project root to path
sys.path.append(os.getcwd())
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

if __name__ == '__main__':
    print(f"Loading data to URL: {db_url.replace(password, '******')}")
    # Run loaddata on the file we exported earlier 'local_dump.json'
    execute_from_command_line(['manage.py', 'loaddata', 'local_dump.json'])
