"""
Test template rendering
"""
from django.template.loader import render_to_string
from orders.models import Order

order = Order.objects.filter(status='QuoteSent').first()

if order:
    context = {
        'order': order,
        'customer_name': order.shipping_recipient_name or 'Test Customer',
        'total': float(order.total),
    }
    
    print("Context:", context)
    print("\nRendering template...")
    
    try:
        html = render_to_string('emails/quote_response_customer.html', context)
        
        # Check if variables are rendered
        if '{{ customer_name }}' in html:
            print("✗ ERROR: Variables NOT rendered!")
            print("Template is not being processed by Django")
        else:
            print("✓ SUCCESS: Variables rendered correctly!")
            
        # Show first 500 chars
        print("\nFirst 500 chars of HTML:")
        print(html[:500])
        
    except Exception as e:
        print(f"✗ Error rendering template: {e}")
        import traceback
        traceback.print_exc()
