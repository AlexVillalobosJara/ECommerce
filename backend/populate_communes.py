"""
Script to populate Chilean communes from official government API
Source: https://apis.digital.gob.cl/dpa/comunas
Total: 346 communes
"""
import requests
from core.models import Commune

# Mapping of region codes to region names
REGION_NAMES = {
    "15": "Arica y Parinacota",
    "01": "Tarapacá",
    "02": "Antofagasta",
    "03": "Atacama",
    "04": "Coquimbo",
    "05": "Valparaíso",
    "13": "Metropolitana de Santiago",
    "06": "Del Libertador Gral. Bernardo O'Higgins",
    "07": "Del Maule",
    "08": "Del Biobío",
    "09": "De la Araucanía",
    "14": "De los Ríos",
    "10": "De los Lagos",
    "11": "Aysén del Gral. Carlos Ibáñez del Campo",
    "12": "Magallanes y de la Antártica Chilena",
    "16": "Ñuble",
}

print("Fetching communes from government API...")
response = requests.get("https://apis.digital.gob.cl/dpa/comunas")
communes_data = response.json()

print(f"Retrieved {len(communes_data)} communes")

# Clear existing communes
print("Clearing existing communes...")
Commune.objects.all().delete()

# Create communes
print("Creating communes...")
created_count = 0

for data in communes_data:
    # Extract region code from commune code (first 2 digits)
    region_code = data["codigo"][:2]
    region_name = REGION_NAMES.get(region_code, "Unknown")
    
    commune = Commune.objects.create(
        code=data["codigo"],
        name=data["nombre"],
        region_code=region_code,
        region_name=region_name,
        latitude=data.get("lat"),
        longitude=data.get("lng"),
    )
    created_count += 1
    
    if created_count % 50 == 0:
        print(f"  Created {created_count} communes...")

print(f"\n✅ Successfully created {created_count} communes")
print(f"Total in database: {Commune.objects.count()}")
