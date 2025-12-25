from rest_framework import viewsets, status
import logging
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from core.models import Commune
from .models import Customer, ShippingZone, Order, OrderItem, DiscountCoupon, CouponUsage, DiscountType
from .serializers import (
    ShippingZoneSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    CommuneSerializer
)
from .serializers_phase4 import (
    QuoteResponseSerializer,
    PaymentConfirmationSerializer
)

from .email_service import (
    send_order_confirmation_email, 
    send_new_order_notification,
    send_quote_response_notification
)
from products.models import ProductVariant


class ShippingZoneViewSet(viewsets.ReadOnlyModelViewSet):
    """Shipping zones for the storefront"""
    serializer_class = ShippingZoneSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return ShippingZone.objects.none()
        
        return ShippingZone.objects.filter(
            tenant=tenant,
            is_active=True,
            deleted_at__isnull=True
        )
    
    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate shipping cost for a commune"""
        commune = request.data.get('commune')
        weight_kg = Decimal(request.data.get('weight_kg', 0))
        subtotal = Decimal(request.data.get('subtotal', 0))
        
        if not commune:
            return Response(
                {'error': 'Commune is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = request.tenant
        if not tenant:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find shipping zone for commune
        # Check both JSON list AND potential legacy string formats just in case
        zones = ShippingZone.objects.filter(
            tenant=tenant,
            is_active=True,
            deleted_at__isnull=True
        )
        
        # Filter zones that contain the commune in their commune_codes array
        zone = None
        for z in zones:
            if z.commune_codes and commune in z.commune_codes:
                zone = z
                break
        
        if not zone:
            # Fallback: Try matching by name if code failed (in case frontend sends name)
            # This is slow but safer for transition
            try:
                commune_obj = Commune.objects.filter(name__iexact=commune).first()
                if commune_obj:
                    for z in zones:
                        if z.commune_codes and commune_obj.code in z.commune_codes:
                            zone = z
                            break
            except:
                pass

        if zone:
            # Calculate cost
            cost = zone.base_cost + (zone.cost_per_kg * weight_kg)
            
            # Check for free shipping
            if zone.free_shipping_threshold and subtotal >= zone.free_shipping_threshold:
                cost = Decimal('0')
            
            return Response({
                'zone_id': zone.id,
                'zone_name': zone.name,
                'cost': cost,
                'estimated_days': zone.estimated_days,
                'is_free': cost == 0
            })
            
        # If no manual zone found, try Carriers
        from .shipping_services import ShippingService
        
        # We need the commune NAME for some carriers, or CODE for others.
        # Let's try to resolve the name if we only have code
        commune_name = commune
        if commune.isdigit() or len(commune) <= 5: # Assuming naive code check
             c_obj = Commune.objects.filter(code=commune).first()
             if c_obj:
                 commune_name = c_obj.name
        
        carrier_rates = ShippingService.calculate_carrier_rates(tenant, commune_name, weight_kg, subtotal)
        
        if carrier_rates:
            # Return the best rate (cheapest)
            # We format it to look like a "Zone" response so Frontend consumes it easily
            # But the "zone_id" will be null, and we'll rely on "shipping_method"
            best_rate = min(carrier_rates, key=lambda x: x['cost'])
            
            return Response({
                'zone_id': None, # Special flag for "Carrier Calculated"
                'zone_name': f"{best_rate['carrier']} - {best_rate['service']}",
                'cost': best_rate['cost'],
                'estimated_days': best_rate['estimated_days'],
                'is_free': False,
                'carrier_data': best_rate # Extra info for debugging or future use
            })

        return Response(
            {'error': 'No shipping zone found for this commune'},
            status=status.HTTP_404_NOT_FOUND
        )


class ShippingCarrierConfigViewSet(viewsets.ModelViewSet):
    """Admin API for Carrier Config"""
    from .models import ShippingCarrierConfig
    from .serializers import ShippingCarrierConfigSerializer
    
    queryset = ShippingCarrierConfig.objects.none()
    serializer_class = ShippingCarrierConfigSerializer
    # permission_classes = [IsAdminUser] # In real app, restrict this
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return ShippingCarrierConfig.objects.none()
        return ShippingCarrierConfig.objects.filter(tenant=tenant)
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant)


class StorefrontCommuneViewSet(viewsets.ReadOnlyModelViewSet):
    """Public API for communes"""
    queryset = Commune.objects.all().order_by('region_code', 'name')
    serializer_class = CommuneSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def by_region(self, request):
        """
        Get communes grouped by region
        Returns: [{region_code, region_name, communes: [...]}, ...]
        """
        communes = self.get_queryset()
        
        # Group by region
        regions = {}
        for commune in communes:
            if commune.region_code not in regions:
                regions[commune.region_code] = {
                    'region_code': commune.region_code,
                    'region_name': commune.region_name,
                    'communes': []
                }
            
            regions[commune.region_code]['communes'].append({
                'id': str(commune.id),
                'code': commune.code,
                'name': commune.name,
                'region_code': commune.region_code,
                'region_name': commune.region_name
            })
        
        # Convert to list and sort by region code
        result = sorted(regions.values(), key=lambda x: x['region_code'])
        
        return Response(result)


class OrderViewSet(viewsets.ModelViewSet):
    """Orders for the storefront"""
    serializer_class = OrderSerializer
    permission_classes = [AllowAny] # Ensure public access for orders
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return Order.objects.none()
        
        return Order.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True
        ).select_related('customer', 'shipping_zone').prefetch_related('items')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new order"""
        tenant = request.tenant
        if not tenant:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Get or create customer
        customer, created = Customer.objects.get_or_create(
            tenant=tenant,
            email=data['customer_email'],
            defaults={
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'phone': data.get('customer_phone', ''),
            }
        )
        
        # Generate order number
        last_order = Order.objects.filter(tenant=tenant).order_by('-created_at').first()
        if last_order and last_order.order_number:
            try:
                last_number = int(last_order.order_number.split('-')[-1])
                order_number = f"{tenant.slug.upper()}-{last_number + 1:06d}"
            except:
                order_number = f"{tenant.slug.upper()}-000001"
        else:
            order_number = f"{tenant.slug.upper()}-000001"
        
        # Determine if this is a quote
        is_quote = data['order_type'] == 'Quote'
        
        # Get shipping zone if provided (not required for quotes)
        shipping_zone = None
        if data.get('shipping_zone_id'):
            shipping_zone = ShippingZone.objects.filter(
                id=data['shipping_zone_id'],
                tenant=tenant
            ).first()
        
        # Calculate totals
        tax_rate = Decimal(tenant.tax_rate or 19) / 100
        prices_include_tax = tenant.prices_include_tax
        
        subtotal = Decimal('0')
        tax_amount = Decimal('0')
        
        # Validate items and calculate subtotal
        items_data = []
        for item_data in data['items']:
            variant = ProductVariant.objects.filter(
                id=item_data['product_variant_id'],
                tenant=tenant
            ).select_related('product').first()
            
            if not variant:
                return Response(
                    {'error': f'Product variant {item_data["product_variant_id"]} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check stock if product manages stock (skip for quotes)
            if not is_quote and variant.product.manage_stock:
                if variant.available_stock < item_data['quantity']:
                    return Response(
                        {'error': f'Insufficient stock for {variant.product.name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Calculate item total (use 0 for quotes if no price)
            unit_price = variant.price or Decimal('0')
            quantity = item_data['quantity']
            item_subtotal = unit_price * quantity
            
            if prices_include_tax:
                # Tax is included in the price
                # Tax = Price - (Price / (1 + rate))
                item_tax = item_subtotal * (1 - (1 / (1 + tax_rate)))
                item_total = item_subtotal
            else:
                # Tax is added on top
                item_tax = item_subtotal * tax_rate
                item_total = item_subtotal + item_tax
            
            subtotal += item_subtotal
            tax_amount += item_tax
            
            items_data.append({
                'variant': variant,
                'quantity': quantity,
                'unit_price': unit_price,
                'subtotal': item_subtotal,
                'tax_amount': item_tax,
                'total': item_total
            })
        
        # Calculate shipping (skip for quotes)
        shipping_cost = Decimal('0')
        if not is_quote and not data.get('is_store_pickup') and shipping_zone:
            # Re-calculate shipping cost to depend on dynamic weight if needed, 
            # but for now use base_cost + weight calculation if zone logic allows.
            # Ideally we re-use the calculation logic, but here we trust the zone defaults or recalculate
            # Let's use the zone's current parameters
            weight_kg = Decimal('5.0') # TODO: Sum item weights
            
            shipping_cost = shipping_zone.base_cost + (shipping_zone.cost_per_kg * weight_kg)
            
            if shipping_zone.free_shipping_threshold and subtotal >= shipping_zone.free_shipping_threshold:
                shipping_cost = Decimal('0')
        
        # Calculate Coupon Discount
        coupon_discount = Decimal('0')
        coupon_code = data.get('coupon_code')
        applied_coupon = None

        if coupon_code:
            now = timezone.now()
            applied_coupon = DiscountCoupon.objects.filter(
                code=coupon_code, 
                tenant=tenant, 
                is_active=True,
                deleted_at__isnull=True,
                valid_from__lte=now,
                valid_until__gte=now
            ).first()
            
            if applied_coupon:
                 # Check usage limits
                 limit_ok = True
                 if applied_coupon.max_uses is not None and applied_coupon.current_uses >= applied_coupon.max_uses:
                     limit_ok = False
                 
                 # Check minimum purchase
                 if applied_coupon.minimum_purchase_amount and subtotal < applied_coupon.minimum_purchase_amount:
                     limit_ok = False

                 if limit_ok:
                       if applied_coupon.discount_type == DiscountType.PERCENTAGE:
                            coupon_discount = (subtotal * applied_coupon.discount_value) / 100
                            if applied_coupon.maximum_discount_amount and coupon_discount > applied_coupon.maximum_discount_amount:
                                 coupon_discount = applied_coupon.maximum_discount_amount
                       elif applied_coupon.discount_type == DiscountType.FIXED_AMOUNT:
                            coupon_discount = applied_coupon.discount_value
                       
                       # Cap at subtotal
                       if coupon_discount > subtotal:
                            coupon_discount = subtotal

        # Calculate total
        if prices_include_tax:
            # Subtotal already includes tax
            total = subtotal + shipping_cost - coupon_discount
        else:
            # Add tax to subtotal
            total = subtotal + tax_amount + shipping_cost - coupon_discount
            
        if total < Decimal('0'):
            total = Decimal('0')
        
        # Create order
        order = Order.objects.create(
            tenant=tenant,
            customer=customer,
            order_number=order_number,
            order_type=data['order_type'],
            status='QuoteRequested' if data['order_type'] == 'Quote' else 'PendingPayment',
            customer_email=data['customer_email'],
            customer_phone=data.get('customer_phone', ''),
            shipping_recipient_name=data['shipping_recipient_name'],
            shipping_phone=data['shipping_phone'],
            shipping_street_address=data['shipping_street_address'],
            shipping_apartment=data.get('shipping_apartment', ''),
            shipping_commune=data['shipping_commune'],
            shipping_city=data['shipping_city'],
            shipping_region=data['shipping_region'],
            shipping_postal_code=data.get('shipping_postal_code', ''),
            subtotal=subtotal,
            discount_amount=coupon_discount,
            coupon_code=coupon_code if (applied_coupon and coupon_discount > 0) else None,
            coupon_discount=coupon_discount,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total=total,
            shipping_zone=shipping_zone,
            is_store_pickup=data.get('is_store_pickup', False),
            customer_notes=data.get('customer_notes', '')
        )
        
        # Create order items
        for item_data in items_data:
            variant = item_data['variant']
            # Get product image URL
            product_image_url = None
            try:
                # Try variant image first
                if variant.image_url:
                    product_image_url = variant.image_url
                # Then try product's primary image
                elif variant.product.images.filter(is_primary=True).exists():
                    primary_image = variant.product.images.filter(is_primary=True).first()
                    if primary_image:
                        product_image_url = primary_image.url
                # Finally try any product image
                elif variant.product.images.exists():
                    first_image = variant.product.images.first()
                    if first_image:
                        product_image_url = first_image.url
            except Exception as e:
                # Log error but don't fail order creation
                print(f"Error getting product image: {e}")
            
            # Create order item
            OrderItem.objects.create(
                tenant=tenant,
                order=order,
                product_variant=variant,
                product_name=variant.product.name,
                variant_name=variant.name or '',
                sku=variant.sku,
                attributes_snapshot=variant.attributes,
                unit_price=item_data['unit_price'],
                quantity=item_data['quantity'],
                subtotal=item_data['subtotal'],
                tax_amount=item_data['tax_amount'],
                total=item_data['total'],
                product_image_url=product_image_url
            )
            
            # Reserve stock if product manages stock
            if variant.product.manage_stock:
                variant.reserved_quantity += item_data['quantity']
                variant.save(update_fields=['reserved_quantity'])
        
        # Record Coupon Usage
        if applied_coupon and coupon_discount > 0:
            CouponUsage.objects.create(
                tenant=tenant,
                coupon=applied_coupon,
                customer=customer,
                order=order,
                discount_amount=coupon_discount
            )
            # Use F expression for atomic update
            from django.db.models import F
            applied_coupon.current_uses = F('current_uses') + 1
            applied_coupon.save(update_fields=['current_uses'])
            

        # Send email notification for quote requests
        if is_quote:
            try:
                from .email_service import send_quote_request_notification
                send_quote_request_notification(order)
            except Exception as e:
                # Log error but don't fail order creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send quote request email: {e}")
        
        # Return created order
        response_serializer = OrderSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def respond_quote(self, request, pk=None):
        """Respond to a quote request with pricing"""
        logger.info(f"Received respond_quote request for order {pk}")
        logger.info(f"Request Data: {request.data}")
        
        order = self.get_object()
        
        if order.order_type != 'Quote':
            return Response(
                {'error': 'This order is not a quote request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Allow re-sending quote if already Sent (for updates)
        if order.status not in ['QuoteRequested', 'QuoteSent']:
            return Response(
                {'error': f'Quote cannot be responded to in status {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = QuoteResponseSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Serializer Validation Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        data = serializer.validated_data
        
        # Update order items with quoted prices
        quote_items = data['quote_items']
        subtotal = Decimal('0')
        tax_rate = Decimal('0.19')
        
        for item in order.items.all():
            # Handle both string ID keys (from JSON) and potential int/UUID matches
            item_quote = quote_items.get(str(item.id)) or quote_items.get(item.id)
            
            if item_quote is not None:
                unit_price = Decimal(str(item_quote))
                item.unit_price = unit_price
                item.subtotal = unit_price * item.quantity
                item.tax_amount = item.subtotal * tax_rate
                item.total = item.subtotal + item.tax_amount
                item.save()
                subtotal += item.subtotal
        
        # Recalculate order totals
        tax_amount = subtotal * tax_rate
        # shipping_cost defaults to 0 if null, or keep existing
        shipping_cost = order.shipping_cost or Decimal('0')
        
        total = subtotal + tax_amount + shipping_cost
        
        order.subtotal = subtotal
        order.tax_amount = tax_amount
        order.total = total
        order.status = 'QuoteSent'
        order.quote_valid_until = data['quote_valid_until']
        order.internal_notes = data.get('internal_notes', '')
        order.save()
        
        logger.info(f"Quote {order.order_number} updated. Sending email to {order.customer_email}")
        
        # Send quote response email
        try:
            response = send_quote_response_notification(order)
            logger.info(f"Email sent response: {response}")
        except Exception as e:
            logger.exception(f"CRITICAL: Failed to send quote response email: {e}")
            # Log traceback
            import traceback
            logger.error(traceback.format_exc())
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm_payment(self, request, pk=None):
        """Confirm payment for an order"""
        order = self.get_object()
        
        if order.status not in ['PendingPayment', 'QuoteApproved']:
            return Response(
                {'error': 'Order is not pending payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PaymentConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Update order status
        order.status = 'Paid'
        order.paid_at = timezone.now()
        order.shipping_method = data['payment_method']
        if data.get('internal_notes'):
            order.internal_notes = (order.internal_notes or '') + '\n' + data['internal_notes']
        order.save()
        
        # Decrement stock and release reserved stock
        for item in order.items.all():
            variant = item.product_variant
            if variant.product.manage_stock:
                # Decrement actual stock
                variant.stock_quantity -= item.quantity
                # Release reserved stock
                variant.reserved_quantity -= item.quantity
                variant.save(update_fields=['stock_quantity', 'reserved_quantity'])
        
                variant.save(update_fields=['stock_quantity', 'reserved_quantity'])
        
        # Emails are now handled by signals.py when status changes to 'Paid'

        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def mark_shipped(self, request, pk=None):
        """Mark order as shipped"""
        order = self.get_object()
        
        if order.status != 'Paid':
            return Response(
                {'error': 'Order must be paid before shipping'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'Shipped'
        order.shipped_at = timezone.now()
        order.save()
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def mark_delivered(self, request, pk=None):
        """Mark order as delivered"""
        order = self.get_object()
        
        if order.status != 'Shipped':
            return Response(
                {'error': 'Order must be shipped before delivery'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'Delivered'
        order.delivered_at = timezone.now()
        order.save()
        
        return Response(OrderSerializer(order).data)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import DiscountCoupon, DiscountType
from decimal import Decimal

class ValidateCouponView(APIView):
    authentication_classes = [] # Public endpoint (storefront)
    permission_classes = []

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        # NOTE: Tenant logic simplified for dev. In prod, ensure tenant context.
        
        if not code:
            return Response({"valid": False, "message": "Código requerido"}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        
        # Try to find an active coupon
        coupon = DiscountCoupon.objects.filter(
            code=code,
            is_active=True,
            valid_from__lte=now,
            valid_until__gte=now,
            deleted_at__isnull=True
        ).first()

        if not coupon:
            return Response({"valid": False, "message": "Cupón inválido o expirado"}, status=status.HTTP_200_OK)

        # Check Global Usage Limits
        if coupon.max_uses is not None and coupon.current_uses >= coupon.max_uses:
            return Response({"valid": False, "message": "Este cupón ha agotado sus usos"}, status=status.HTTP_200_OK)

        # Calculate Discount
        # We need the cart total to validate minimum_purchase_amount
        cart_total = Decimal(str(request.data.get('cartTotal', 0)))
        
        if coupon.minimum_purchase_amount and cart_total < coupon.minimum_purchase_amount:
             return Response({
                 "valid": False, 
                 "message": f"El monto mínimo de compra es ${format(coupon.minimum_purchase_amount, '.0f')}"
             }, status=status.HTTP_200_OK)

        discount_amount = Decimal(0)

        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount_amount = (cart_total * coupon.discount_value) / 100
            # Apply Cap
            if coupon.maximum_discount_amount and discount_amount > coupon.maximum_discount_amount:
                discount_amount = coupon.maximum_discount_amount
        
        elif coupon.discount_type == DiscountType.FIXED_AMOUNT:
            discount_amount = coupon.discount_value
        
        # Ensure discount doesn't exceed total
        if discount_amount > cart_total:
            discount_amount = cart_total

        return Response({
            "valid": True,
            "coupon_id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "discount_amount": float(discount_amount),
            "message": "Cupón aplicado correctamente"
        })
