from rest_framework import serializers
from .models import Tenant


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer for Tenant model
    """
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'status',
            'logo_url', 'primary_color', 'secondary_color', 'custom_domain',
            'transbank_api_key', 'transbank_commerce_code',
            'mercadopago_access_token', 'mercadopago_public_key',
            'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
            'smtp_from_email', 'smtp_from_name',
            'legal_name', 'tax_id', 'phone', 'email', 'address',
            'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_image_url',
            'shipping_mode',
            'subscription_plan', 'subscription_expires_at',
            'max_products', 'max_orders_per_month',
            # Regional Settings
            'tax_rate', 'decimal_separator', 'thousands_separator', 'decimal_places', 'country',
            # General Settings
            'prices_include_tax', 'show_product_ratings', 'allow_reviews', 'show_related_products',
            # Policies
            'privacy_policy_mode', 'privacy_policy_text', 'terms_policy_mode', 'terms_policy_text',
            # Terms Configuration
            'shipping_days_min', 'shipping_days_max', 'return_window_days', 
            'return_shipping_cost_cover', 'warranty_period',
            # Company Info
            'about_us_text', 'our_history_text', 'mission_text', 'vision_text', 'faq_text',
            # CTA Section
            'cta_title', 'cta_description', 'cta_button_text', 'cta_link',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def validate_slug(self, value):
        """Ensure slug is URL-friendly"""
        if not value.replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError("Slug must contain only letters, numbers, hyphens, and underscores")
        return value.lower()
