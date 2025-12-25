"""
Direct PDF test - save to file
"""
from orders.models import Order
from orders.pdf_generator import generate_quote_pdf

# Get order
order = Order.objects.filter(status='QuoteSent').first()

if not order:
    print("No QuoteSent orders found")
else:
    print(f"Generating PDF for order: {order.order_number}")
    
    try:
        # Generate PDF
        pdf_content = generate_quote_pdf(order)
        
        # Save to file
        filename = f"test_quote_{order.order_number}.pdf"
        with open(filename, 'wb') as f:
            f.write(pdf_content)
        
        print(f"✓ PDF generated successfully!")
        print(f"✓ Saved to: {filename}")
        print(f"✓ Size: {len(pdf_content)} bytes")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
