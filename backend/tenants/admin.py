from django.contrib import admin
from django.contrib import admin
from .models import Tenant, TenantUser


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'status', 'email', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'slug', 'email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'slug', 'status')
        }),
        ('Branding', {
            'fields': ('logo_url', 'primary_color', 'secondary_color', 'custom_domain')
        }),
        ('Business Information', {
            'fields': ('legal_name', 'tax_id', 'phone', 'email', 'address')
        }),
        ('Subscription', {
            'fields': ('subscription_plan', 'subscription_expires_at', 'max_products', 'max_orders_per_month')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'deleted_at')
        }),
    )


@admin.register(TenantUser)
class TenantUserAdmin(admin.ModelAdmin):
    list_display = ['user', 'tenant', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'tenant']
    search_fields = ['user__username', 'user__email', 'tenant__name']

