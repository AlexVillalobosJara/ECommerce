from django.db import migrations

def seed_premium_palettes(apps, schema_editor):
    PremiumPalette = apps.get_model('tenants', 'PremiumPalette')
    palettes = [
        {
            "name": "Elegancia Industrial",
            "primary_color": "#6FA9D2",
            "secondary_color": "#F3F4F6",
            "secondary_text_color": "#F0EFEC",
            "accent_dark_color": "#2B2C30",
            "accent_medium_color": "#3F4A52"
        },
        {
            "name": "Mármol Moderno",
            "primary_color": "#D1D5DB",
            "secondary_color": "#FFFFFF",
            "secondary_text_color": "#1F2937",
            "accent_dark_color": "#111827",
            "accent_medium_color": "#374151"
        },
        {
            "name": "Bosque Profundo",
            "primary_color": "#064E3B",
            "secondary_color": "#ECFDF5",
            "secondary_text_color": "#F0F9FF",
            "accent_dark_color": "#064E3B",
            "accent_medium_color": "#065F46"
        },
        {
            "name": "Atardecer Cálido",
            "primary_color": "#F97316",
            "secondary_color": "#FFF7ED",
            "secondary_text_color": "#431407",
            "accent_dark_color": "#7C2D12",
            "accent_medium_color": "#9A3412"
        }
    ]
    for p in palettes:
        PremiumPalette.objects.get_or_create(name=p["name"], defaults=p)

def remove_premium_palettes(apps, schema_editor):
    PremiumPalette = apps.get_model('tenants', 'PremiumPalette')
    names = ["Elegancia Industrial", "Mármol Moderno", "Bosque Profundo", "Atardecer Cálido"]
    PremiumPalette.objects.filter(name__in=names).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0016_tenant_is_premium'),
    ]

    operations = [
        migrations.RunPython(seed_premium_palettes, remove_premium_palettes),
    ]
