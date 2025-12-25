import json
from orders.models import ShippingZone
from tenants.models import Tenant

# Get tenant
tenant = Tenant.objects.filter(slug='demo-store').first()

if not tenant:
    print("ERROR: Tenant 'demo-store' not found")
    exit()

print(f"Using tenant: {tenant.name}")

# Delete existing zones
ShippingZone.objects.filter(tenant=tenant).delete()
print("Deleted existing shipping zones")

# Create zones
zones_data = [
    {
        'name': 'Santiago Centro',
        'description': 'Despacho a comunas del centro de Santiago',
        'commune_codes': ['Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa'],
        'base_cost': 5000,
        'cost_per_kg': 0,
        'free_shipping_threshold': 100000,
        'estimated_days': 1,
    },
    {
        'name': 'Gran Santiago',
        'description': 'Despacho a comunas de Santiago',
        'commune_codes': ['Maipú', 'La Florida', 'Puente Alto', 'San Bernardo', 'Quilicura'],
        'base_cost': 8000,
        'cost_per_kg': 500,
        'free_shipping_threshold': 150000,
        'estimated_days': 2,
    },
    {
        'name': 'Regiones',
        'description': 'Despacho a regiones de Chile',
        'commune_codes': ['Valparaíso', 'Viña del Mar', 'Concepción', 'Temuco', 'Puerto Montt'],
        'base_cost': 15000,
        'cost_per_kg': 1000,
        'free_shipping_threshold': 200000,
        'estimated_days': 5,
    },
]

for zone_data in zones_data:
    zone = ShippingZone.objects.create(
        tenant=tenant,
        **zone_data
    )
    print(f"Created: {zone.name} with {len(zone.commune_codes)} communes")

print(f"\nSuccess! Created {len(zones_data)} shipping zones")
