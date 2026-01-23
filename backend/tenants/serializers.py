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
    Full serializer for Admin/Management use.
    Includes sensitive fields.
    """
    marketing_config = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'marketing_config']
    
    def get_marketing_config(self, obj):
        try:
            if hasattr(obj, 'marketing_config'):
                config = obj.marketing_config
                return {
                    'gtm_container_id': config.gtm_container_id,
                    'ga4_measurement_id': config.ga4_measurement_id,
                    'meta_pixel_id': config.meta_pixel_id,
                    'tiktok_pixel_id': config.tiktok_pixel_id,
                }
        except Exception: pass
        return None

class StorefrontTenantSerializer(serializers.ModelSerializer):
    """
    Lightweight and SAFE serializer for public storefront.
    Excludes ALL credentials, passwords, and sensitive settings.
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
            'primary_btn_text_color', 'custom_domain',
            'legal_name', 'phone', 'email', 'address',
            'hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_image_url',
            'shipping_mode', 'tax_rate', 'decimal_separator', 
            'thousands_separator', 'decimal_places', 'country',
            'prices_include_tax', 'show_product_ratings', 'allow_reviews', 'show_related_products',
            'privacy_policy_mode', 'privacy_policy_text', 'terms_policy_mode', 'terms_policy_text',
            'shipping_days_min', 'shipping_days_max', 'return_window_days', 
            'return_shipping_cost_cover', 'warranty_period',
            'about_us_text', 'our_history_text', 'mission_text', 'vision_text', 'faq_text',
            'cta_title', 'cta_description', 'cta_button_text', 'cta_link',
            'shipping_workdays', 'marketing_config'
        ]

    def get_marketing_config(self, obj):
        try:
            if hasattr(obj, 'marketing_config'):
                config = obj.marketing_config
                return {
                    'gtm_container_id': config.gtm_container_id,
                    'ga4_measurement_id': config.ga4_measurement_id,
                    'meta_pixel_id': config.meta_pixel_id,
                    'tiktok_pixel_id': config.tiktok_pixel_id,
                }
        except Exception: pass
        return None
