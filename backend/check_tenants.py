# -*- coding: utf-8 -*-
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from tenants.models import Tenant

def check_tenants():
    print(f"{'Slug':<20} | {'Logo URL':<50}")
    print("-" * 73)
    for t in Tenant.objects.all():
        logo = t.logo_url if t.logo_url else "None"
        print(f"{t.slug:<20} | {logo[:50]}...")

if __name__ == "__main__":
    check_tenants()
