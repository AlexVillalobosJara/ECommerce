
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')
django.setup()

from orders.payment_models import Payment

def check_failed_payments():
    print("--- Recent Failed Payments ---")
    failed = Payment.objects.filter(status='Failed').order_by('-created_at')[:10]
    for p in failed:
        print(f"Time: {p.created_at}, Order: {p.order.order_number}, Status: {p.status}")
        print(f"  Error: {p.error_message}")
        print("-" * 20)
    
    if not failed:
        print("No failed payments found.")
    print("--- End ---")

if __name__ == "__main__":
    check_failed_payments()
