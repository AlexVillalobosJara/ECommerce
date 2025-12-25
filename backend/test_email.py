"""
Test script to debug email sending
"""
from orders.models import Order
from orders.email_service import send_quote_response_notification
import logging

# Enable logging
logging.basicConfig(level=logging.DEBUG)

# Get a quote order
order = Order.objects.filter(status='QuoteSent').first()

if not order:
    print("No QuoteSent orders found")
else:
    print(f"Testing email for order: {order.order_number}")
    print(f"Customer email: {order.customer_email}")
    print(f"Order items: {order.items.count()}")
    
    # Try to send email
    try:
        result = send_quote_response_notification(order)
        print(f"SUCCESS! Email sent: {result}")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()
