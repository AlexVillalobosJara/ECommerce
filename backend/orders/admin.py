from django.contrib import admin
from .models import Customer, ShippingZone, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'variant_name', 'sku', 'unit_price', 'quantity', 'total']
    fields = ['product_name', 'variant_name', 'sku', 'unit_price', 'quantity', 'total']




@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'tenant', 'created_at']
    list_filter = ['tenant']
    search_fields = ['email', 'first_name', 'last_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'base_cost', 'is_active']
    list_filter = ['tenant', 'is_active']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'tenant', 'customer_email', 'order_type', 'status', 'total', 'created_at']
    list_filter = ['tenant', 'order_type', 'status', 'created_at']
    search_fields = ['order_number', 'customer_email']
    readonly_fields = ['id', 'order_number', 'subtotal', 'tax_amount', 'total', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('id', 'tenant', 'customer', 'order_number', 'order_type', 'status')
        }),
        ('Customer Contact', {
            'fields': ('customer_email', 'customer_phone')
        }),
        ('Shipping Address', {
            'fields': (
                'shipping_recipient_name', 'shipping_phone', 'shipping_street_address',
                'shipping_apartment', 'shipping_commune', 'shipping_city', 'shipping_region'
            )
        }),
        ('Amounts', {
            'fields': ('subtotal', 'discount_amount', 'shipping_cost', 'tax_amount', 'total')
        }),
        ('Shipping', {
            'fields': ('shipping_zone', 'shipping_method', 'is_store_pickup')
        }),
        ('Notes', {
            'fields': ('customer_notes', 'internal_notes')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'paid_at', 'shipped_at', 'delivered_at')
        }),
    )
