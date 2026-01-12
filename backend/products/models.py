import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField
from tenants.models import Tenant


class Category(models.Model):
    """Product categories with hierarchical support"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='categories')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    
    # Information
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    
    # Ordering
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'categories'
        ordering = ['sort_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'slug'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_category_slug_per_tenant'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'slug']),
            models.Index(fields=['tenant', 'sort_order']),
            models.Index(fields=['parent']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class Product(models.Model):
    """Products catalog"""
    
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Published', 'Published'),
        ('Archived', 'Archived'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Basic Information
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=300)
    short_description = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Technical Specs (JSON: {"Material": "Madera", "Color": "Roble"})
    specifications = models.JSONField(default=dict, blank=True)
    
    # Classification
    sku = models.CharField(max_length=100, blank=True, null=True)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    brand = models.CharField(max_length=100, blank=True, null=True)
    
    # Critical Flags
    is_quote_only = models.BooleanField(default=False, help_text="If true, no price shown, only quote")
    manage_stock = models.BooleanField(default=True, help_text="If false, don't decrement inventory")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    is_featured = models.BooleanField(default=False)
    
    # SEO
    meta_title = models.CharField(max_length=200, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    meta_keywords = models.TextField(blank=True, null=True)
    
    # Dimensions (for shipping)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    length_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Statistics
    views_count = models.IntegerField(default=0)
    sales_count = models.IntegerField(default=0)

    # Ratings
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    review_count = models.IntegerField(default=0)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'slug'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_product_slug_per_tenant'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'slug']),
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', 'is_featured']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.tenant.name})"


class ProductVariant(models.Model):
    """Product variants with dynamic attributes"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='product_variants')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    
    # Identification
    sku = models.CharField(max_length=100)
    barcode = models.CharField(max_length=100, blank=True, null=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    
    # Dynamic Attributes (JSONB)
    # Example: {"Talla": "M", "Color": "Rojo", "Material": "Algodón"}
    attributes = models.JSONField(default=dict)
    
    # Prices (Nullable for quote-only products)
    price = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    compare_at_price = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    # Inventory
    stock_quantity = models.IntegerField(default=0)
    reserved_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=10)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    
    # Media
    image_url = models.TextField(blank=True, null=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'product_variants'
        ordering = ['product', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'sku'],
                condition=models.Q(deleted_at__isnull=True),
                name='unique_variant_sku_per_tenant'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'sku']),
            models.Index(fields=['product']),
            models.Index(fields=['barcode']),
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.name or self.sku}"
    
    @property
    def available_stock(self):
        """Available stock = total - reserved"""
        return max(0, self.stock_quantity - self.reserved_quantity)


class ProductImage(models.Model):
    """Product image gallery"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='product_images')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    
    # Image
    url = models.TextField()
    alt_text = models.CharField(max_length=200, blank=True, null=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'product_images'
        ordering = ['product', 'sort_order']
        indexes = [
            models.Index(fields=['product', 'sort_order']),
        ]
    
    def __str__(self):
        return f"Image for {self.product.name}"


class ProductReview(models.Model):
    """Product reviews and ratings"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='product_reviews')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    
    # Customer Info (Optional link to customer, simple fields for now)
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField(blank=True, null=True)
    
    # Rating
    rating = models.IntegerField(
        validators=[
            RegexValidator(regex=r'^[1-5]$', message='Rating must be between 1 and 5')
        ]
    )
    comment = models.TextField(blank=True, null=True)
    
    # Moderation
    is_approved = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'product_reviews'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['tenant', 'is_approved']),
        ]
    
    def __str__(self):
        return f"{self.rating}★ - {self.product.name}"
    
    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        # Update product aggregation if new or approved status changed
        # Making this simple synchronous update for now
        self.update_product_ratings()
        
    def update_product_ratings(self):
        from django.db.models import Avg, Count
        
        aggregates = ProductReview.objects.filter(
            product=self.product,
            is_approved=True
        ).aggregate(avg=Avg('rating'), count=Count('id'))
        
        self.product.average_rating = aggregates['avg'] or 0
        self.product.review_count = aggregates['count'] or 0
        self.product.save(update_fields=['average_rating', 'review_count'])

