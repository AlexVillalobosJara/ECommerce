from rest_framework import serializers
from orders.models import DiscountCoupon, DiscountType

class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = [
            'id', 'tenant', 'code', 'description', 
            'discount_type', 'discount_value',
            'minimum_purchase_amount', 'maximum_discount_amount',
            'max_uses', 'max_uses_per_customer', 'current_uses',
            'applicable_to_categories', 'applicable_to_products',
            'valid_from', 'valid_until', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'tenant', 'current_uses', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Check valid dates.
        """
        valid_from = data.get('valid_from')
        valid_until = data.get('valid_until')

        if valid_from and valid_until and valid_from > valid_until:
             raise serializers.ValidationError({"valid_until": "End date must be after start date."})
        
        return data
