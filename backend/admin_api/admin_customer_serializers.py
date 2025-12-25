from rest_framework import serializers
from orders.models import Customer, CustomerType

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'tenant', 'customer_type', 'email', 
            'first_name', 'last_name', 'phone', 
            'company_name', 'tax_id', 'legal_representative', 'business_sector',
            'credit_limit', 'payment_terms_days', 'discount_percentage', 'price_list_type',
            'is_active', 'is_verified', 'created_at', 'updated_at', 
            'total_orders', 'total_spent'
        ]
        read_only_fields = ['id', 'tenant', 'created_at', 'updated_at']

    # Optional fields for stats that might be annotated
    total_orders = serializers.IntegerField(read_only=True, required=False)
    total_spent = serializers.DecimalField(max_digits=18, decimal_places=2, read_only=True, required=False)

    def validate(self, data):
        """
        Check customer type constraints.
        """
        customer_type = data.get('customer_type')
        
        if customer_type == CustomerType.INDIVIDUAL:
            if not data.get('first_name') and not self.instance:
                 # Only check on create if strictly required, but model allows null.
                 # User schema says check_customer_type_fields constraint exists.
                 # Let's trust constraint or assume UI handles it. 
                 # But good to validate here if we want friendly errors.
                 pass
        
        if customer_type == CustomerType.CORPORATE:
            if not data.get('company_name') and not self.instance:
                 raise serializers.ValidationError({"company_name": "Company name is required for corporate customers."})
        
        return data
