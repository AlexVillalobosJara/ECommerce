from rest_framework import serializers
from tenants.marketing_config_models import TenantMarketingConfig


class TenantMarketingConfigSerializer(serializers.ModelSerializer):
    """Serializer for tenant marketing configuration"""
    
    class Meta:
        model = TenantMarketingConfig
        fields = [
            'id',
            'gtm_container_id',
            'ga4_measurement_id',
            'meta_pixel_id',
            'tiktok_pixel_id',
            'google_merchant_id',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_gtm_container_id(self, value):
        """Validate GTM container ID format"""
        if value and not value.startswith('GTM-'):
            raise serializers.ValidationError(
                "GTM Container ID must start with 'GTM-' (e.g., GTM-XXXXXXX)"
            )
        return value
    
    def validate_ga4_measurement_id(self, value):
        """Validate GA4 measurement ID format"""
        if value and not value.startswith('G-'):
            raise serializers.ValidationError(
                "GA4 Measurement ID must start with 'G-' (e.g., G-XXXXXXXXXX)"
            )
        return value
