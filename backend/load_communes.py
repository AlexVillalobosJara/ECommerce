"""
Load communes from JSON file into database
"""
import json
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

print("Loading communes from JSON file...")
with open('communes_data.json', 'r', encoding='utf-8') as f:
    communes_data = json.load(f)

print(f"Found {len(communes_data)} communes in file")

# Clear existing communes
print("Clearing existing communes...")
deleted_count = Commune.objects.all().delete()[0]
print(f"Deleted {deleted_count} existing communes")

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

# Show some examples
print("\nExamples:")
for commune in Commune.objects.all()[:5]:
    print(f"  - {commune.name}, {commune.region_name} (code: {commune.code})")
