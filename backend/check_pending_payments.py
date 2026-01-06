
import os
import django
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.payment_models import Payment

def check_pending_payments():
    print("--- Pending Payments Today ---")
    today = timezone.now().date()
    pending = Payment.objects.filter(status='Pending', created_at__date=today).order_by('-created_at')
    print(f"Total Pending Today: {pending.count()}")
    for p in pending:
        print(f"Time: {p.created_at}, Order: {p.order.order_number}")
    print("--- End ---")

if __name__ == "__main__":
    check_pending_payments()
