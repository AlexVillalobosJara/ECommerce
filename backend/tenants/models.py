import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField
from .payment_config_models import PaymentGatewayConfig  # Import payment config model


class Tenant(models.Model):
    """
    Tenant model for multi-tenant B2B2C system.
    Each tenant represents an independent company.
    """
    
    STATUS_CHOICES = [
        ('Trial', 'Trial'),
        ('Active', 'Active'),
        ('Suspended', 'Suspended'),
        ('Cancelled', 'Cancelled'),
    ]
    
    # Primary fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Trial')
    
    # Branding
    logo_url = models.TextField(blank=True, null=True)
    primary_color = models.CharField(
        max_length=7, 
        default='#000000',
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$', message='Must be a valid hex color')]
    )
    secondary_color = models.CharField(
        max_length=7, 
        default='#FFFFFF',
        validators=[RegexValidator(regex=r'^#[0-9A-Fa-f]{6}$', message='Must be a valid hex color')]
    )
    custom_domain = models.CharField(max_length=255, blank=True, null=True)
    
    # Payment Configuration (stored as plain text for POC)
    transbank_api_key = models.TextField(blank=True, null=True)
    transbank_commerce_code = models.CharField(max_length=50, blank=True, null=True)
    mercadopago_access_token = models.TextField(blank=True, null=True)
    mercadopago_public_key = models.TextField(blank=True, null=True)
    khipu_receiver_id = models.CharField(max_length=50, blank=True, null=True)
    khipu_secret_key = models.TextField(blank=True, null=True)
    
    # SMTP Configuration
    smtp_host = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(blank=True, null=True)
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.TextField(blank=True, null=True)
    smtp_from_email = models.EmailField(blank=True, null=True)
    smtp_from_name = models.CharField(max_length=255, blank=True, null=True)
    
    # Business Info
    legal_name = models.CharField(max_length=300, blank=True, null=True)
    tax_id = models.CharField(max_length=20, blank=True, null=True)  # RUT in Chile
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Storefront Configuration
    hero_title = models.CharField(max_length=200, blank=True, null=True, default="El Arte del Diseño Minimalista")
    hero_subtitle = models.CharField(max_length=300, blank=True, null=True, default="Cada pieza cuenta una historia de elegancia y funcionalidad")
    hero_cta_text = models.CharField(max_length=50, blank=True, null=True, default="Explorar Colección")
    hero_image_url = models.TextField(blank=True, null=True)
    
    # Shipping Configuration
    SHIPPING_MODES = [
        ('Zones', 'Manual Zones'),
        ('Provider', 'External Provider'), # e.g., Starken, Chilexpress
        ('Hybrid', 'Hybrid (Zones then Provider)'),
    ]
    shipping_mode = models.CharField(max_length=20, choices=SHIPPING_MODES, default='Zones')
    
    # Subscription
    subscription_plan = models.CharField(max_length=50, blank=True, null=True)
    subscription_expires_at = models.DateTimeField(blank=True, null=True)
    max_products = models.IntegerField(default=100)
    max_orders_per_month = models.IntegerField(default=1000)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(blank=True, null=True)
    updated_by = models.UUIDField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug'], name='idx_tenants_slug'),
            models.Index(fields=['status'], name='idx_tenants_status'),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.slug})"
    
    def delete(self, *args, **kwargs):
        """Soft delete by setting deleted_at timestamp"""
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()

    # Regional Settings
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=19.00, help_text="Tax rate percentage (e.g. 19.00 for 19%)")
    decimal_separator = models.CharField(max_length=1, default='.', choices=[('.', '.'), (',', ',')])
    thousands_separator = models.CharField(max_length=1, default=',', choices=[(',', ','), ('.', '.')])
    decimal_places = models.IntegerField(default=0)
    country = models.CharField(max_length=100, default='Chile')

    # General Settings
    prices_include_tax = models.BooleanField(default=False, help_text="If true, displayed prices include tax")
    show_product_ratings = models.BooleanField(default=True)
    allow_reviews = models.BooleanField(default=True)
    show_related_products = models.BooleanField(default=True)
    
    # Policies
    POLICY_modes = [
        ('Default', 'Use Default'),
        ('Custom', 'Custom Text'),
        ('Url', 'External URL'),
    ]
    privacy_policy_mode = models.CharField(max_length=20, choices=POLICY_modes, default='Default')
    privacy_policy_text = models.TextField(blank=True, null=True)
    
    terms_policy_mode = models.CharField(max_length=20, choices=POLICY_modes, default='Default')
    terms_policy_text = models.TextField(blank=True, null=True)

    # Terms & Conditions Variables
    shipping_days_min = models.IntegerField(default=3)
    shipping_days_max = models.IntegerField(default=7)
    shipping_workdays = ArrayField(models.IntegerField(), default=list, blank=True, help_text="Days of the week for shipping (0=Mon, 6=Sun)")
    return_window_days = models.IntegerField(default=30)
    RETURN_COST_CHOICES = [
        ('Customer', 'Cliente'),
        ('Company', 'Empresa'),
    ]
    return_shipping_cost_cover = models.CharField(max_length=20, choices=RETURN_COST_CHOICES, default='Customer')
    warranty_period = models.CharField(max_length=50, default='6 meses')
    
    # Company Info / Pages
    about_us_text = models.TextField(blank=True, null=True)
    our_history_text = models.TextField(blank=True, null=True)
    mission_text = models.TextField(blank=True, null=True)
    vision_text = models.TextField(blank=True, null=True)
    faq_text = models.TextField(blank=True, null=True)  # Could be JSONField later

    # Call to Action (CTA) Section
    cta_title = models.CharField(max_length=200, blank=True, null=True, default="Explora Toda Nuestra Colección")
    cta_description = models.TextField(blank=True, null=True, default="Descubre más de 100 productos diseñados para profesionales. Calidad premium y durabilidad garantizada.")
    cta_button_text = models.CharField(max_length=50, blank=True, null=True, default="Ver Catálogo Completo")
    cta_link = models.CharField(max_length=255, blank=True, null=True, default="/products")


class TenantUser(models.Model):
    """
    Link between Users and Tenants.
    Determines which users have access to which tenants.
    """
    ROLE_CHOICES = [
        ('Owner', 'Propietario'),  # Full access
        ('Admin', 'Administrador'), # High access, restricted to tenant
        ('Operator', 'Operador'),   # Read-only/Limited access
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='users')
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='tenants')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Staff')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_users'
        unique_together = ['tenant', 'user']
        indexes = [
            models.Index(fields=['user', 'tenant']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.tenant.name} ({self.role})"


class Redirect(models.Model):
    """
    Model to store 301 redirects for a tenant.
    Preserves SEO authority by mapping old URLs to new ones.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='redirects')
    old_path = models.CharField(max_length=500, help_text="The path to redirect from (e.g., /old-product-url)")
    new_path = models.CharField(max_length=500, help_text="The path to redirect to (e.g., /products/new-product-url)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tenant_redirects'
        unique_together = ['tenant', 'old_path']
        indexes = [
            models.Index(fields=['tenant', 'old_path'], name='idx_redirect_lookup'),
        ]

    def __str__(self):
        return f"[{self.tenant.slug}] {self.old_path} -> {self.new_path}"

