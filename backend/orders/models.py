from django.db import models
from django.contrib.postgres.fields import ArrayField
import uuid
from .payment_models import PaymentGateway, PaymentStatus, Payment, PaymentWebhookLog


class CustomerType(models.TextChoices):
    INDIVIDUAL = 'Individual', 'Individual'
    CORPORATE = 'Corporate', 'Corporate'


class BillingType(models.TextChoices):
    BOLETA = 'Boleta', 'Boleta'
    FACTURA = 'Factura', 'Factura'


class PriceListType(models.TextChoices):
    RETAIL = 'Retail', 'Retail'
    WHOLESALE = 'Wholesale', 'Wholesale'
    VIP = 'VIP', 'VIP'


class Customer(models.Model):
    """Customer model for orders"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='customers')
    
    # Basic Info
    customer_type = models.CharField(max_length=20, choices=CustomerType.choices, default=CustomerType.INDIVIDUAL)
    email = models.EmailField()
    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Corporate Info
    company_name = models.CharField(max_length=300, blank=True, null=True)
    tax_id = models.CharField(max_length=20, blank=True, null=True)  # RUT
    legal_representative = models.CharField(max_length=200, blank=True, null=True)
    business_sector = models.CharField(max_length=100, blank=True, null=True)
    
    # Commercial Terms
    credit_limit = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    payment_terms_days = models.IntegerField(default=0)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    price_list_type = models.CharField(max_length=20, choices=PriceListType.choices, default=PriceListType.RETAIL)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'customers'
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'email'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_customer_email_per_tenant'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'email']),
            models.Index(fields=['tenant', 'tax_id']),
        ]
    
    def __str__(self):
        if self.customer_type == CustomerType.CORPORATE and self.company_name:
            return f"{self.company_name} ({self.email})"
        name = f"{self.first_name} {self.last_name}".strip()
        return f"{name or 'Unknown'} ({self.email})"


class ShippingZone(models.Model):
    """Shipping zones with costs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='shipping_zones')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    commune_codes = ArrayField(models.CharField(max_length=100), default=list)
    base_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    estimated_days = models.IntegerField(default=3)
    allows_store_pickup = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'shipping_zones'
    
    def __str__(self):
        return f"{self.name} - ${self.base_cost}"



class OrderType(models.TextChoices):
    SALE = 'Sale', 'Sale'
    QUOTE = 'Quote', 'Quote'


class OrderStatus(models.TextChoices):
    DRAFT = 'Draft', 'Draft'
    PENDING_PAYMENT = 'PendingPayment', 'Pending Payment'
    PAID = 'Paid', 'Paid'
    QUOTE_REQUESTED = 'QuoteRequested', 'Quote Requested'
    QUOTE_SENT = 'QuoteSent', 'Quote Sent'
    QUOTE_APPROVED = 'QuoteApproved', 'Quote Approved'
    PROCESSING = 'Processing', 'Processing'
    SHIPPED = 'Shipped', 'Shipped'
    DELIVERED = 'Delivered', 'Delivered'
    CANCELLED = 'Cancelled', 'Cancelled'
    REFUNDED = 'Refunded', 'Refunded'


class Order(models.Model):
    """
    Orders and Quotes.
    Includes address snapshots for historical audit.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='orders')
    customer = models.ForeignKey('orders.Customer', on_delete=models.RESTRICT, related_name='orders')
    
    # Order identification
    order_number = models.CharField(max_length=50, blank=True)  # Auto-generated by DB trigger
    order_type = models.CharField(max_length=10, choices=OrderType.choices, default=OrderType.SALE)
    status = models.CharField(max_length=20, choices=OrderStatus.choices, default=OrderStatus.DRAFT)
    
    # Billing Info (Chile)
    billing_type = models.CharField(max_length=10, choices=BillingType.choices, default=BillingType.BOLETA)
    billing_business_name = models.CharField(max_length=300, blank=True, null=True)
    billing_business_giro = models.CharField(max_length=300, blank=True, null=True)
    
    # Customer contact (snapshot)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Shipping address (snapshot)
    shipping_recipient_name = models.CharField(max_length=200, blank=True, null=True)
    shipping_phone = models.CharField(max_length=20, blank=True, null=True)
    shipping_street_address = models.TextField(blank=True, null=True)
    shipping_apartment = models.CharField(max_length=50, blank=True, null=True)
    shipping_commune = models.CharField(max_length=100, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_region = models.CharField(max_length=100, blank=True, null=True)
    shipping_postal_code = models.CharField(max_length=10, blank=True, null=True)
    shipping_country = models.CharField(max_length=2, default='CL')
    
    # Billing address (snapshot)
    billing_recipient_name = models.CharField(max_length=200, blank=True, null=True)
    billing_tax_id = models.CharField(max_length=20, blank=True, null=True)  # RUT
    billing_street_address = models.TextField(blank=True, null=True)
    billing_commune = models.CharField(max_length=100, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_region = models.CharField(max_length=100, blank=True, null=True)
    
    # Financial totals
    subtotal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    shipping_cost = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    # Discounts
    coupon_code = models.CharField(max_length=50, blank=True, null=True)
    coupon_discount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    
    # Shipping
    shipping_zone = models.ForeignKey(
        'orders.ShippingZone',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    shipping_method = models.CharField(max_length=100, blank=True, null=True)
    is_store_pickup = models.BooleanField(default=False)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    
    # Notes
    customer_notes = models.TextField(blank=True, null=True)
    internal_notes = models.TextField(blank=True, null=True)
    
    # Quote-specific fields
    quote_valid_until = models.DateField(null=True, blank=True)
    quote_sent_at = models.DateTimeField(null=True, blank=True)
    quote_approved_at = models.DateTimeField(null=True, blank=True)
    
    # Payment fields
    payment_method = models.CharField(max_length=50, blank=True, null=True)  # e.g., "Credit Card", "Debit Card"
    payment_gateway = models.CharField(
        max_length=20,
        choices=PaymentGateway.choices,
        blank=True,
        null=True
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        blank=True,
        null=True
    )
    
    # Status timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'order_type']),
            models.Index(fields=['tenant', 'order_number']),
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['customer_email']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'order_number'],
                name='unique_order_number_per_tenant'
            ),
            models.CheckConstraint(
                check=models.Q(total__gte=0),
                name='check_order_totals'
            ),
        ]
    
    def __str__(self):
        return f"{self.order_number} - {self.customer_email}"
    
    @property
    def is_quote(self):
        return self.order_type == OrderType.QUOTE
    
    @property
    def is_sale(self):
        return self.order_type == OrderType.SALE
    
    @property
    def can_cancel(self):
        """Can cancel if not shipped/delivered/cancelled"""
        return self.status not in [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.CANCELLED]


class OrderItem(models.Model):
    """
    Order line items with product snapshots for audit trail.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='order_items')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.RESTRICT,
        related_name='order_items'
    )
    
    # Product snapshot (for historical accuracy)
    product_name = models.CharField(max_length=300)
    variant_name = models.CharField(max_length=200, blank=True, null=True)
    sku = models.CharField(max_length=100)
    attributes_snapshot = models.JSONField(null=True, blank=True)
    
    # Pricing snapshot
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    quantity = models.IntegerField()
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=18, decimal_places=2)
    total = models.DecimalField(max_digits=18, decimal_places=2)
    
    # Image snapshot
    product_image_url = models.TextField(blank=True, null=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'order_items'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['tenant']),
            models.Index(fields=['order']),
            models.Index(fields=['product_variant']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name='check_order_item_quantity'
            ),
            models.CheckConstraint(
                check=models.Q(total__gte=0),
                name='check_order_item_totals'
            ),
        ]
    
    def __str__(self):
        return f"{self.product_name} x{self.quantity}"

class DiscountType(models.TextChoices):
    PERCENTAGE = 'Percentage', 'Percentage'
    FIXED_AMOUNT = 'FixedAmount', 'Fixed Amount'
    FREE_SHIPPING = 'FreeShipping', 'Free Shipping'

class DiscountCoupon(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='coupons')
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=18, decimal_places=2)
    
    # Usage Limits
    minimum_purchase_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    maximum_discount_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    max_uses = models.IntegerField(null=True, blank=True)
    max_uses_per_customer = models.IntegerField(default=1, null=True, blank=True)
    current_uses = models.IntegerField(default=0)
    
    # Restrictions
    applicable_to_categories = ArrayField(models.UUIDField(), blank=True, null=True) # List of Category IDs
    applicable_to_products = ArrayField(models.UUIDField(), blank=True, null=True) # List of Product IDs
    
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'discount_coupons'
        constraints = [
            models.UniqueConstraint(fields=['tenant', 'code'], condition=models.Q(deleted_at__isnull=True), name='unique_coupon_code_per_tenant'),
            models.CheckConstraint(check=models.Q(valid_until__gt=models.F('valid_from')), name='check_coupon_dates')
        ]
        indexes = [
            models.Index(fields=['tenant', 'code'], condition=models.Q(deleted_at__isnull=True, is_active=True), name='idx_coupons_active'),
            models.Index(fields=['tenant'], condition=models.Q(deleted_at__isnull=True), name='idx_discount_coupons_tenant_id'),
        ]

    def __str__(self):
        return f"{self.code} ({self.discount_value} {self.discount_type})"
        

class CouponUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='coupon_usages')
    coupon = models.ForeignKey(DiscountCoupon, on_delete=models.CASCADE, related_name='usages')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='coupon_usage')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='coupon_usages')
    discount_amount = models.DecimalField(max_digits=18, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'coupon_usage'
        indexes = [
            models.Index(fields=['coupon'], name='idx_coupon_usage_coupon_id'),
            models.Index(fields=['customer'], name='idx_coupon_usage_customer_id'),
            models.Index(fields=['tenant'], name='idx_coupon_usage_tenant_id'),
        ]


class CarrierName(models.TextChoices):
    STARKEN = 'Starken', 'Starken'
    CHILEXPRESS = 'Chilexpress', 'Chilexpress'
    BLUE_EXPRESS = 'BlueExpress', 'Blue Express'


class ShippingCarrierConfig(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='carrier_configs')
    carrier_name = models.CharField(max_length=50, choices=CarrierName.choices)
    is_active = models.BooleanField(default=False)
    
    # Credentials
    api_key = models.CharField(max_length=255, blank=True, null=True)
    api_secret = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Additional settings (origin address, service codes, etc.)
    extra_settings = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipping_carrier_configs'
        unique_together = [['tenant', 'carrier_name']]

