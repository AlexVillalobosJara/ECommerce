from rest_framework import serializers
from .models import Tenant, PremiumPalette


class PremiumPaletteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PremiumPalette
        fields = [
            'id', 'name', 'primary_color', 'secondary_color',
            'secondary_text_color', 'accent_dark_color', 'accent_medium_color',
            'header_bg_color', 'header_text_color',
            'hero_text_color', 'hero_btn_bg_color', 'hero_btn_text_color',
            'cta_text_color', 'cta_btn_bg_color', 'cta_btn_text_color',
            'footer_bg_color', 'footer_text_color',
            'primary_btn_text_color',
            'palette_type',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MarketingConfigSerializer(serializers.Serializer):
    """Nested serializer for marketing configuration"""
    gtm_container_id = serializers.CharField(allow_null=True, required=False)
    ga4_measurement_id = serializers.CharField(allow_null=True, required=False)
    meta_pixel_id = serializers.CharField(allow_null=True, required=False)
    tiktok_pixel_id = serializers.CharField(allow_null=True, required=False)


class TenantSerializer(serializers.ModelSerializer):
    """
    Serializer for Tenant model
    """
    marketing_config = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'status', 'is_premium',
            'logo_url', 'primary_color', 'secondary_color', 
            'success_color', 'danger_color', 'warning_color', 'info_color', 'muted_color',
            'secondary_text_color', 'accent_dark_color', 'accent_medium_color',
            'header_bg_color', 'header_text_color',
            'hero_text_color', 'hero_btn_bg_color', 'hero_btn_text_color',
            'cta_text_color', 'cta_btn_bg_color', 'cta_btn_text_color',
            'footer_bg_color', 'footer_text_color',
            'primary_btn_text_color',
            'custom_domain',
            'transbank_api_key', 'transbank_commerce_code',
            'mercadopago_access_token', 'mercadopago_public_key',
            'khipu_receiver_id', 'khipu_secret_key',
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
            'shipping_workdays',
            # Marketing
            'marketing_config',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'marketing_config']
    
    def get_marketing_config(self, obj):
        """Get marketing configuration for tenant"""
        try:
            if hasattr(obj, 'marketing_config'):
                config = obj.marketing_config
                return {
                    'gtm_container_id': config.gtm_container_id,
                    'ga4_measurement_id': config.ga4_measurement_id,
                    'meta_pixel_id': config.meta_pixel_id,
                    'tiktok_pixel_id': config.tiktok_pixel_id,
                }
        except Exception:
            pass
        return None
    
    def validate_slug(self, value):
        """Ensure slug is URL-friendly"""
        if not value.replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError("Slug must contain only letters, numbers, hyphens, and underscores")
        return value.lower()
