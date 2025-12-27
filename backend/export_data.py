
import os
import sys
from django.core.management import call_command

# Add project root to path
sys.path.append(os.getcwd())
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

# Ensure we are using the local database settings by removing DATABASE_URL if present
if 'DATABASE_URL' in os.environ:
    del os.environ['DATABASE_URL']

import django
django.setup()

output_file = 'local_dump.json'

print(f"Exporting data (Tenants, Communes, Users) to {output_file} with UTF-8 encoding...")
with open(output_file, 'w', encoding='utf-8') as f:
    call_command('dumpdata', 'tenants.Tenant', 'core.Commune', 'auth.User', 'tenants.TenantUser', indent=2, stdout=f)
print("Export complete.")
