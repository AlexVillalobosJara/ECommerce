from orders.models import Order
from tenants.models import Tenant
from orders.payment_services import PaymentServiceFactory
import traceback

# Get the order
tenant = Tenant.objects.get(slug='demo-store')
order = Order.objects.get(id='4b0cd34e-5799-4b84-b910-973f6e036da3')

print(f"Testing payment for order: {order.order_number}")
print(f"Email: {order.customer_email}")
print(f"Total: {order.total}")

# Try to create payment
service = PaymentServiceFactory.get_service('Flow', tenant=tenant)

try:
    result = service.create_payment(
        order=order,
        amount=order.total,
        return_url='http://localhost:3000/payment/callback',
        cancel_url='http://localhost:3000/payment/cancelled'
    )
    print(f"\n✅ SUCCESS!")
    print(f"Payment URL: {result.get('payment_url')}")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"\nFull traceback:")
    traceback.print_exc()
