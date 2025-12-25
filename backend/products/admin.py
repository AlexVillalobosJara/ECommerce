from django.contrib import admin
from .models import Category, Product, ProductVariant, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'parent', 'sort_order', 'is_active', 'created_at']
    list_filter = ['tenant', 'is_active', 'created_at']
    search_fields = ['name', 'slug']
    readonly_fields = ['id', 'created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'parent', 'name', 'slug', 'description', 'image_url', 'icon')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Settings', {
            'fields': ('sort_order', 'is_active')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at')
        }),
    )


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['sku', 'name', 'attributes', 'price', 'stock_quantity', 'is_active', 'is_default']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['url', 'alt_text', 'sort_order', 'is_primary']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'category', 'status', 'is_quote_only', 'is_featured', 'created_at']
    list_filter = ['tenant', 'status', 'is_quote_only', 'is_featured', 'created_at']
    search_fields = ['name', 'slug', 'sku', 'brand']
    readonly_fields = ['id', 'views_count', 'sales_count', 'created_at', 'updated_at']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductVariantInline, ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'category', 'name', 'slug', 'short_description', 'description')
        }),
        ('Classification', {
            'fields': ('sku', 'barcode', 'brand')
        }),
        ('Flags', {
            'fields': ('is_quote_only', 'manage_stock', 'status', 'is_featured')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords')
        }),
        ('Dimensions', {
            'fields': ('weight_kg', 'length_cm', 'width_cm', 'height_cm')
        }),
        ('Statistics', {
            'fields': ('views_count', 'sales_count')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'published_at')
        }),
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['sku', 'product', 'name', 'price', 'stock_quantity', 'is_active', 'is_default']
    list_filter = ['tenant', 'is_active', 'is_default']
    search_fields = ['sku', 'name', 'product__name']
    readonly_fields = ['id', 'available_stock', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'tenant', 'product', 'sku', 'barcode', 'name', 'attributes')
        }),
        ('Pricing', {
            'fields': ('price', 'compare_at_price', 'cost')
        }),
        ('Inventory', {
            'fields': ('stock_quantity', 'reserved_quantity', 'available_stock', 'low_stock_threshold')
        }),
        ('Settings', {
            'fields': ('is_active', 'is_default', 'image_url')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at')
        }),
    )
