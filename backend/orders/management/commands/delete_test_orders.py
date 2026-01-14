from django.core.management.base import BaseCommand
from orders.models import Order

class Command(BaseCommand):
    help = 'Delete test orders for demo-store tenant'

    def handle(self, *args, **options):
        tenant_id = '00000000-0000-0000-0000-000000000001'
        deleted_count = Order.objects.filter(tenant_id=tenant_id).delete()[0]
        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} orders'))
