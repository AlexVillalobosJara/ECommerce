"""
Management command to seed shipping zones for testing.
Run with: python manage.py seed_shipping_zones
"""
from django.core.management.base import BaseCommand
from tenants.models import Tenant
from orders.models import ShippingZone


class Command(BaseCommand):
    help = 'Seeds the database with sample shipping zones for testing'

    def handle(self, *args, **kwargs):
        # Get the first active tenant
        tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        
        if not tenant:
            self.stdout.write(self.style.ERROR('No active tenant found. Please create a tenant first.'))
            return
        
        self.stdout.write(f'Using tenant: {tenant.name} ({tenant.slug})')
        
        # Create shipping zones
        self.stdout.write('Creating shipping zones...')
        
        # Zone 1: Santiago Centro (free shipping over 100k)
        santiago_centro = ShippingZone.objects.create(
            tenant=tenant,
            name='Santiago Centro',
            description='Despacho a comunas del centro de Santiago',
            commune_codes=['Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa'],
            base_cost=5000,
            cost_per_kg=0,
            free_shipping_threshold=100000,
            estimated_days=1,
            allows_store_pickup=True,
            is_active=True
        )
        
        # Zone 2: Gran Santiago
        gran_santiago = ShippingZone.objects.create(
            tenant=tenant,
            name='Gran Santiago',
            description='Despacho a comunas de Santiago',
            commune_codes=['Maipú', 'La Florida', 'Puente Alto', 'San Bernardo', 'Quilicura'],
            base_cost=8000,
            cost_per_kg=500,
            free_shipping_threshold=150000,
            estimated_days=2,
            allows_store_pickup=False,
            is_active=True
        )
        
        # Zone 3: Regiones
        regiones = ShippingZone.objects.create(
            tenant=tenant,
            name='Regiones',
            description='Despacho a regiones de Chile',
            commune_codes=['Valparaíso', 'Viña del Mar', 'Concepción', 'Temuco', 'Puerto Montt'],
            base_cost=15000,
            cost_per_kg=1000,
            free_shipping_threshold=200000,
            estimated_days=5,
            allows_store_pickup=False,
            is_active=True
        )
        
        self.stdout.write(self.style.SUCCESS(f'Created {ShippingZone.objects.filter(tenant=tenant).count()} shipping zones'))
        self.stdout.write(self.style.SUCCESS('Shipping zones seeded successfully!'))
