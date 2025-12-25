from rest_framework import serializers
from orders.models import Customer, ShippingZone, Order, OrderItem
from products.models import ProductVariant


class AdminCustomerSerializer(serializers.ModelSerializer):
    """Customer serializer for admin"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'phone', 'tax_id']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class AdminOrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer for admin"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_variant', 'product_name', 'variant_name', 'sku',
            'attributes_snapshot', 'unit_price', 'quantity', 'discount_amount',
            'subtotal', 'tax_amount', 'total', 'product_image_url'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total']


class AdminOrderListSerializer(serializers.ModelSerializer):
    """Order list serializer for admin - lightweight"""
    customer_name = serializers.SerializerMethodField()
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'status',
            'customer_email', 'customer_name', 'items_count',
            'subtotal', 'shipping_cost', 'tax_amount', 'total',
            'created_at', 'paid_at', 'shipped_at', 'delivered_at'
        ]
        read_only_fields = ['id', 'order_number']
    
    def get_customer_name(self, obj):
        if obj.shipping_recipient_name:
            return obj.shipping_recipient_name
        return obj.customer_email
    
    def get_items_count(self, obj):
        return obj.items.count()


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    """Order detail serializer for admin - complete"""
    items = AdminOrderItemSerializer(many=True, read_only=True)
    customer = AdminCustomerSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'status',
            'customer', 'customer_email', 'customer_phone',
            # Shipping address
            'shipping_recipient_name', 'shipping_phone', 'shipping_street_address',
            'shipping_apartment', 'shipping_commune', 'shipping_city', 'shipping_region',
            'shipping_postal_code', 'shipping_country',
            # Billing address
            'billing_recipient_name', 'billing_tax_id', 'billing_street_address',
            'billing_commune', 'billing_city', 'billing_region',
            # Financial
            'subtotal', 'discount_amount', 'shipping_cost', 'tax_amount', 'total',
            'coupon_code', 'coupon_discount',
            # Shipping
            'shipping_zone', 'shipping_method', 'is_store_pickup', 'estimated_delivery_date',
            # Notes
            'customer_notes', 'internal_notes',
            # Quote fields
            'quote_valid_until', 'quote_sent_at', 'quote_approved_at',
            # Timestamps
            'created_at', 'updated_at', 'paid_at', 'shipped_at', 'delivered_at', 'cancelled_at',
            # Items
            'items'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'tax_amount', 'total',
            'created_at', 'updated_at'
        ]


class AdminOrderStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating order status"""
    status = serializers.ChoiceField(choices=[
        ('Draft', 'Draft'),
        ('PendingPayment', 'Pending Payment'),
        ('Paid', 'Paid'),
        ('QuoteRequested', 'Quote Requested'),
        ('QuoteSent', 'Quote Sent'),
        ('QuoteApproved', 'Quote Approved'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
        ('Refunded', 'Refunded'),
    ])
    notes = serializers.CharField(required=False, allow_blank=True)
