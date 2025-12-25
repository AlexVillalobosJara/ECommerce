"""
Test PDF generation and email sending
"""
from orders.models import Order
from orders.pdf_generator import generate_quote_pdf
from orders.email_service import send_quote_response_notification
import traceback

# Get a quote order
order = Order.objects.filter(status='QuoteSent').first()

if not order:
    print("No QuoteSent orders found")
else:
    print(f"Testing for order: {order.order_number}")
    
    # Test PDF generation
    print("\n1. Testing PDF generation...")
    try:
        pdf_content = generate_quote_pdf(order)
        print(f"   ✓ PDF generated successfully ({len(pdf_content)} bytes)")
    except Exception as e:
        print(f"   ✗ PDF generation failed: {e}")
        traceback.print_exc()
    
    # Test email sending
    print("\n2. Testing email sending...")
    try:
        result = send_quote_response_notification(order)
        print(f"   ✓ Email sent successfully: {result}")
    except Exception as e:
        print(f"   ✗ Email sending failed: {e}")
        traceback.print_exc()
