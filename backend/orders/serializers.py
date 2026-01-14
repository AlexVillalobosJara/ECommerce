from rest_framework import serializers
from .models import Customer, ShippingZone, Order, OrderItem
from products.models import ProductVariant




class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'phone', 'tax_id'
        ]
        read_only_fields = ['id']


class ShippingZoneSerializer(serializers.ModelSerializer):
    commune_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ShippingZone
        fields = [
            'id', 'name', 'description', 'commune_codes', 'base_cost', 
            'cost_per_kg', 'free_shipping_threshold', 'estimated_days',
            'allows_store_pickup', 'is_active', 'commune_count'
        ]
        read_only_fields = ['id', 'commune_count']
    
    def get_commune_count(self, obj):
        # Handle count logic in to_representation for consistency with patched data
        if obj.commune_codes and len(obj.commune_codes) > 0 and obj.commune_codes[0] == '[':
             # It's corrupted, will be fixed in to_representation
             try:
                 import json
                 return len(json.loads("".join(obj.commune_codes)))
             except:
                 return 0
        return len(obj.commune_codes) if obj.commune_codes else 0

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Fix for corrupted commune_codes stored as list of characters
        codes = ret.get('commune_codes', [])
        if codes and isinstance(codes, list) and len(codes) > 0 and codes[0] == '[':
            try:
                import json
                # Join the characters back into a string and parse it
                json_str = "".join(codes)
                # Parse the JSON string to get the actual list
                parsed_codes = json.loads(json_str)
                ret['commune_codes'] = parsed_codes
                # Update count
                ret['commune_count'] = len(parsed_codes)
            except Exception as e:
                pass
        return ret

    def validate(self, data):
        """
        Validate that chosen communes are not already assigned to another zone
        """
        commune_codes = data.get('commune_codes', [])
        if not commune_codes:
            return data
            
        # Get Tenant
        tenant = None
        if self.instance:
            tenant = self.instance.tenant
        else:
            request = self.context.get('request')
            if request:
                tenant = getattr(request, 'tenant', None)
            
            # Fallback if no tenant in request (consistency with ViewSet)
            if not tenant:
                from tenants.models import Tenant
                tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        
        if not tenant:
            # Should not happen in normal flow, but safety check
            return data

        # Check for overlaps
        from django.db.models import Q
        existing_zones_query = ShippingZone.objects.filter(tenant=tenant, deleted_at__isnull=True)
        
        if self.instance:
            existing_zones_query = existing_zones_query.exclude(id=self.instance.id)
            
        existing_zones = existing_zones_query.only('commune_codes', 'name')
        
        normalized_new_codes = set(str(c).strip() for c in commune_codes)
        
        for zone in existing_zones:
            zone_codes = zone.commune_codes
            if not zone_codes:
                continue
                
            # Normalize zone codes (handle potential corruption or legacy format)
            normalized_zone_codes = set()
            
            # Check for corruption pattern
            if len(zone_codes) > 0 and zone_codes[0] == '[':
                try:
                    import json
                    parsed = json.loads("".join(zone_codes))
                    normalized_zone_codes = set(str(c).strip() for c in parsed)
                except:
                    pass
            else:
                normalized_zone_codes = set(str(c).strip() for c in zone_codes)
            
            # Check intersection
            overlap = normalized_new_codes.intersection(normalized_zone_codes)
            
            if overlap:
                # Fetch names for better UX
                from core.models import Commune
                overlap_list = list(overlap)
                commune_names = list(Commune.objects.filter(code__in=overlap_list).values_list('name', flat=True))
                
                # Fallback to codes if names not found or empty
                display_list = commune_names if commune_names else overlap_list
                
                conflicting_communes = ", ".join(display_list[:3])
                if len(display_list) > 3:
                     conflicting_communes += "..."
                
                raise serializers.ValidationError({
                    'commune_codes': f"Las siguientes comunas ya están asignadas a la zona '{zone.name}': {conflicting_communes}"
                })
                
        return data


class CommuneSerializer(serializers.ModelSerializer):
    """Serializer for individual communes"""
    class Meta:
        from core.models import Commune
        model = Commune
        fields = ['id', 'code', 'name', 'region_code', 'region_name', 'latitude', 'longitude']
        read_only_fields = fields


class CommunesByRegionSerializer(serializers.Serializer):
    """Serializer for communes grouped by region"""
    region_code = serializers.CharField()
    region_name = serializers.CharField()
    communes = CommuneSerializer(many=True)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_variant', 'product_name', 'variant_name', 'sku',
            'attributes_snapshot', 'unit_price', 'quantity', 'discount_amount',
            'subtotal', 'tax_amount', 'total', 'product_image_url'
        ]
        read_only_fields = ['id']


class OrderItemCreateSerializer(serializers.Serializer):
    """Serializer for creating order items"""
    product_variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'status', 'customer',
            'customer_email', 'customer_phone',
            'billing_type', 'billing_business_name', 'billing_business_giro',
            'shipping_recipient_name',
            'shipping_phone', 'shipping_street_address', 'shipping_apartment',
            'shipping_commune', 'shipping_city', 'shipping_region',
            'shipping_postal_code', 'shipping_country', 'subtotal',
            'discount_amount', 'shipping_cost', 'tax_amount', 'total',
            'shipping_method', 'is_store_pickup', 'customer_notes',
            'estimated_delivery_date',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'subtotal', 'tax_amount', 'total',
            'created_at', 'updated_at'
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders"""
    order_type = serializers.ChoiceField(choices=['Sale', 'Quote'])
    
    # Customer info
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    # Shipping address - optional for quotes
    shipping_recipient_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_street_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    shipping_apartment = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_commune = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_region = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # Billing Info (Chile)
    billing_type = serializers.ChoiceField(choices=['Boleta', 'Factura'], default='Boleta')
    billing_business_name = serializers.CharField(max_length=300, required=False, allow_blank=True)
    billing_business_giro = serializers.CharField(max_length=300, required=False, allow_blank=True)
    billing_tax_id = serializers.CharField(max_length=20, required=False, allow_blank=True)  # For Factura
    
    # Shipping method
    is_store_pickup = serializers.BooleanField(default=False)
    shipping_zone_id = serializers.UUIDField(required=False, allow_null=True)
    
    # Items
    items = OrderItemCreateSerializer(many=True)
    
    # Notes
    customer_notes = serializers.CharField(required=False, allow_blank=True)
    
    # Estimated Delivery
    estimated_delivery_date = serializers.DateField(required=False, allow_null=True)
    
    # Coupon
    coupon_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    # Carrier Integration
    shipping_method = serializers.CharField(required=False, allow_blank=True) # e.g. "Starken - Domicilio"
    
    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must have at least one item")
        return items
    
    def validate(self, data):
        # Skip shipping validation for quotes
        if data.get('order_type') == 'Quote':
            return data
            
        # For sales, if not store pickup, shipping zone is required
        if not data.get('is_store_pickup') and not data.get('shipping_zone_id'):
            # Allow order if no manual zone but we integrated carriers, 
            # HOWEVER, the Frontend should have resolved a "Pseudo-Zone" ID if it selected a carrier.
            # But the Carrier rates return a "Zone ID" equal to the carrier ID? No.
            # The calculation logic returns a structure. 
            # If the user selects a Carrier Rate, we need to handle that.
            # Ideally the Frontend sends `shipping_method` and `shipping_cost` 
            # and we validate it.
            # For now, let's relax this check or assume frontend passes a special ID or we handle it in Create.
            pass
            
            # Reverting relaxation: The frontend currently sets `shipping_zone_id`.
            # If we use carriers, we might set `shipping_zone_id` to Null but set `shipping_method`.
            # So we change the validation to: Zone OR Pickup OR Carrier Method.
            if not data.get('shipping_method'): 
                 raise serializers.ValidationError({
                    'shipping_zone_id': 'Shipping zone or method is required when not using store pickup'
                })
        return data


class ShippingCarrierConfigSerializer(serializers.ModelSerializer):
    has_api_key = serializers.SerializerMethodField()
    has_api_secret = serializers.SerializerMethodField()

    class Meta:
        from .models import ShippingCarrierConfig
        model = ShippingCarrierConfig
        fields = [
            'id', 'carrier_name', 'is_active', 
            'api_key', 'api_secret', 'account_number', 
            'extra_settings', 'created_at', 'updated_at',
            'has_api_key', 'has_api_secret'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'has_api_key', 'has_api_secret']
        extra_kwargs = {
            'api_key': {'write_only': True},      # Security: don't return secrets
            'api_secret': {'write_only': True}
        }
    
    def get_has_api_key(self, obj):
        return bool(obj.api_key)

    def get_has_api_secret(self, obj):
        return bool(obj.api_secret)


