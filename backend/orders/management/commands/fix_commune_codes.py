from django.core.management.base import BaseCommand
from orders.models import ShippingZone


class Command(BaseCommand):
    help = 'Fix commune_codes data in shipping zones'

    def handle(self, *args, **options):
        zones = ShippingZone.objects.all()
        
        for zone in zones:
            self.stdout.write(f'Zone: {zone.name}')
            self.stdout.write(f'  Current commune_codes type: {type(zone.commune_codes)}')
            self.stdout.write(f'  Current commune_codes value: {zone.commune_codes}')
            
            # If commune_codes is a string, convert to list
            if isinstance(zone.commune_codes, str):
                try:
                    import json
                    zone.commune_codes = json.loads(zone.commune_codes)
                    zone.save()
                    self.stdout.write(self.style.SUCCESS(f'  Fixed {zone.name}'))
                except:
                    self.stdout.write(self.style.ERROR(f'  Could not fix {zone.name}'))
            elif isinstance(zone.commune_codes, list):
                self.stdout.write(self.style.SUCCESS(f'  {zone.name} is already correct'))
            else:
                self.stdout.write(self.style.WARNING(f'  {zone.name} has unexpected type'))
        
        self.stdout.write(self.style.SUCCESS('Done!'))
