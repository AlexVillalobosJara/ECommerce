import uuid
from django.db import models
from tenants.models import Tenant


class TenantMarketingConfig(models.Model):
    """Marketing and analytics configuration per tenant"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name='marketing_config'
    )
    
    # Google Tag Manager
    gtm_container_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Format: GTM-XXXXXXX"
    )
    
    # Google Analytics 4
    ga4_measurement_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Format: G-XXXXXXXXXX"
    )
    
    # Meta (Facebook/Instagram) Pixel - for future use
    meta_pixel_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Format: 16-digit number"
    )
    
    # TikTok Pixel - for future use
    tiktok_pixel_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="TikTok Pixel ID"
    )
    
    # Google Merchant Center - for future use
    google_merchant_id = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Google Merchant Center ID"
    )
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenant_marketing_config'
        verbose_name = 'Tenant Marketing Configuration'
        verbose_name_plural = 'Tenant Marketing Configurations'
    
    def __str__(self):
        return f"Marketing Config - {self.tenant.name}"
