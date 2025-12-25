"""
Debug template rendering
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
    
    print("=" * 60)
    print("CONTEXT:")
    print("=" * 60)
    for key, value in context.items():
        if key == 'order':
            print(f"{key}: {value.order_number}")
        else:
            print(f"{key}: {value}")
    
    print("\n" + "=" * 60)
    print("RENDERING TEMPLATE...")
    print("=" * 60)
    
    html = render_to_string('emails/quote_response_customer.html', context)
    
    print(f"\nHTML Length: {len(html)} characters")
    
    # Check for unrendered variables
    if '{{' in html:
        print("\n⚠️  WARNING: Found unrendered template tags!")
        import re
        tags = re.findall(r'\{\{[^}]+\}\}', html)
        print(f"Found {len(tags)} unrendered tags:")
        for tag in set(tags[:10]):  # Show first 10 unique
            print(f"  - {tag}")
    else:
        print("\n✓ No unrendered template tags found")
    
    # Show snippet
    print("\n" + "=" * 60)
    print("HTML SNIPPET (first 800 chars):")
    print("=" * 60)
    print(html[:800])
    
    # Save to file for inspection
    with open('rendered_email.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("\n✓ Full HTML saved to: rendered_email.html")
