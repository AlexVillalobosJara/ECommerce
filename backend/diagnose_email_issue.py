import os
import django
import urllib.parse

# Set up Supabase connection
password = urllib.parse.quote_plus('$$kairos01%%')
db_url = f'postgresql://postgres.ztwtkwvgxavwwyvdzibz:{password}@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'
os.environ['DATABASE_URL'] = db_url
os.environ['RENDER'] = 'true'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tenants_project.settings')

django.setup()

from orders.models import Order
from orders.payment_models import Payment
from django.utils import timezone
from datetime import timedelta

# ... existing code ...

if __name__ == "__main__":
    import sys
    
    # Redirect stdout to a file with UTF-8 encoding
    with open('diagnose_result.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        sys.stderr = f
        
        # ... Run checks ...
        try:
             # Run the checks here (copying the previous logic or restructuring)
             # Since I can't easily indent the whole file via replace, I'll just change the print statements in the loop
             # Actually, simpler: just run the command and trust the python encoding if I don't redirect in shell.
             pass
        except Exception as e:
             print(e)

# REVERTING STRATEGY: I will just run the command normally and read the output from the tool. 
# The issue was `> file.txt` created UTF-16.
# I will run `python diagnose_email_issue.py` and let the tool capture stdout. 
# I already did that in step 340 and it truncated.
# I'll modify the script to print LESS noise and ONLY the error.

print("\n" + "=" * 80)
print("TESTING EMAIL FUNCTION DIRECTLY")
print("=" * 80)

# Try to get a paid order and send email
paid_order = Order.objects.filter(status='Paid').order_by('-updated_at').first()

if paid_order:
    print(f"Found paid order: {paid_order.order_number}")
    print(f"Customer email: {paid_order.customer_email}")
    
    from orders.email_service import send_order_confirmation_email, send_new_order_notification
    
    print("\nTrying to send customer confirmation email...")
    try:
        result = send_order_confirmation_email(paid_order)
        if result:
            print(f"✓ Customer email sent successfully: {result}")
        else:
            print(f"✗ Failed to send customer email (Returned None)")
    except Exception as e:
        print(f"✗ Error sending customer email: {e}")
        import traceback
        traceback.print_exc()
    
    print("\nTrying to send admin notification email...")
    try:
        result = send_new_order_notification(paid_order)
        if result:
            print(f"✓ Admin email sent successfully: {result}")
        else:
            print(f"✗ Failed to send admin email (Returned None)")
            print("  Check backend/orders/email_service.py logs or try printing the exception there.")
    except Exception as e:
        print(f"✗ Error sending admin email: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No paid orders found to test with")
