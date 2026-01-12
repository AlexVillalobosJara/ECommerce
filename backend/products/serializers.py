from django.db import models
from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage, ProductReview


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'alt_text', 'sort_order', 'is_primary']


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer for product reviews"""
    
    class Meta:
        model = ProductReview
        fields = ['id', 'customer_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductVariantSerializer(serializers.ModelSerializer):
    available_stock = serializers.ReadOnlyField()
    has_discount = serializers.SerializerMethodField()
    selling_price = serializers.SerializerMethodField()
    original_price = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'name', 'attributes', 'price', 'compare_at_price',
            'selling_price', 'original_price', 'has_discount',
            'stock_quantity', 'reserved_quantity', 'available_stock',
            'is_active', 'is_default', 'image_url'
        ]

    def get_has_discount(self, obj):
        if not obj.price or not obj.compare_at_price:
            return False
        return obj.price != obj.compare_at_price

    def get_selling_price(self, obj):
        if not obj.price:
            return obj.compare_at_price
        if not obj.compare_at_price:
            return obj.price
        return min(obj.price, obj.compare_at_price)

    def get_original_price(self, obj):
        if not obj.price or not obj.compare_at_price:
            return None
        if obj.price == obj.compare_at_price:
            return None
        return max(obj.price, obj.compare_at_price)


class ProductVariantWriteSerializer(serializers.ModelSerializer):
    """Writable serializer for creating/updating product variants"""
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'sku', 'name', 'attributes', 'price', 'compare_at_price',
            'cost', 'stock_quantity', 'low_stock_threshold',
            'is_active', 'is_default', 'image_url', 'barcode'
        ]
        read_only_fields = ['id']
    
    def validate_sku(self, value):
        """Ensure SKU is unique per tenant"""
        tenant = self.context['request'].tenant
        instance = self.instance
        
        # Check for existing SKU (excluding current instance if updating)
        query = ProductVariant.objects.filter(
            tenant=tenant,
            sku=value,
            deleted_at__isnull=True
        )
        
        if instance:
            query = query.exclude(id=instance.id)
        
        if query.exists():
            raise serializers.ValidationError("SKU already exists for this tenant")
        
        return value
    
    def create(self, validated_data):
        """Create variant with tenant from request"""
        validated_data['tenant'] = self.context['request'].tenant
        return super().create(validated_data)
    
    def validate(self, data):
        """Validate variant data"""
        # Validate compare_at_price is greater than price
        price = data.get('price')
        compare_at_price = data.get('compare_at_price')
        
        if price and compare_at_price:
            if compare_at_price <= price:
                raise serializers.ValidationError({
                    'compare_at_price': 'El precio de comparación debe ser mayor que el precio de venta'
                })
        
        return data



class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image_url', 'icon',
            'sort_order', 'is_active', 'product_count', 'children', 'parent'
        ]
    
    def get_product_count(self, obj):
        if hasattr(obj, 'annotated_product_count'):
            return obj.annotated_product_count
        return obj.products.filter(status='Published', deleted_at__isnull=True).count()
    
    def get_children(self, obj):
        # Only include children if this is a top-level category
        if obj.parent is None:
            children = obj.children.filter(is_active=True, deleted_at__isnull=True).order_by('sort_order')
            return CategorySerializer(children, many=True, context=self.context).data
        return []


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product listing (less detail)"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    min_compare_at_price = serializers.SerializerMethodField()
    has_discount = serializers.SerializerMethodField()
    variants_count = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'category_name',
            'is_quote_only', 'is_featured', 'status', 'primary_image',
            'min_price', 'max_price', 'min_compare_at_price', 'has_discount',
            'variants_count', 'in_stock', 'average_rating', 'review_count'
        ]
    
    def get_primary_image(self, obj):
        if hasattr(obj, 'annotated_primary_image') and obj.annotated_primary_image:
            return obj.annotated_primary_image
            
        primary = obj.images.filter(is_primary=True, deleted_at__isnull=True).first()
        if primary:
            return primary.url
        # Fallback to first image
        first = obj.images.filter(deleted_at__isnull=True).order_by('sort_order').first()
        return first.url if first else None
    
    def get_min_price(self, obj):
        if obj.is_quote_only:
            return None
        if hasattr(obj, 'annotated_min_price'):
            return obj.annotated_min_price
            
        variants = obj.variants.filter(is_active=True, deleted_at__isnull=True)
        prices = []
        for v in variants:
            if v.price and v.compare_at_price:
                prices.append(min(v.price, v.compare_at_price))
            elif v.price:
                prices.append(v.price)
            elif v.compare_at_price:
                prices.append(v.compare_at_price)
        return min(prices) if prices else None
    
    def get_max_price(self, obj):
        if obj.is_quote_only:
            return None
        if hasattr(obj, 'annotated_max_price'):
            return obj.annotated_max_price
            
        variants = obj.variants.filter(is_active=True, deleted_at__isnull=True)
        prices = []
        for v in variants:
            if v.price and v.compare_at_price:
                prices.append(min(v.price, v.compare_at_price))
            elif v.price:
                prices.append(v.price)
            elif v.compare_at_price:
                prices.append(v.compare_at_price)
        return max(prices) if prices else None

    def get_min_compare_at_price(self, obj):
        if obj.is_quote_only:
            return None
        
        if hasattr(obj, 'annotated_min_compare_price'):
            return obj.annotated_min_compare_price
            
        # Find the variant with the minimum selling price and return its reference (max) price
        variant = None
        min_selling = None
        
        variants = obj.variants.filter(is_active=True, deleted_at__isnull=True)
        for v in variants:
            selling = None
            if v.price and v.compare_at_price:
                selling = min(v.price, v.compare_at_price)
            elif v.price:
                selling = v.price
            elif v.compare_at_price:
                selling = v.compare_at_price
            
            if selling is not None:
                if min_selling is None or selling < min_selling:
                    min_selling = selling
                    variant = v
        
        if variant and variant.price and variant.compare_at_price and variant.price != variant.compare_at_price:
            return max(variant.price, variant.compare_at_price)
        return None

    def get_has_discount(self, obj):
        if obj.is_quote_only:
            return False
        # Any variant has a discount if price != compare_at_price
        for v in obj.variants.filter(is_active=True, deleted_at__isnull=True):
            if v.price and v.compare_at_price and v.price != v.compare_at_price:
                return True
        return False
    
    def get_variants_count(self, obj):
        if hasattr(obj, 'annotated_variants_count'):
            return obj.annotated_variants_count
        return obj.variants.filter(is_active=True, deleted_at__isnull=True).count()
    
    def get_in_stock(self, obj):
        if not obj.manage_stock:
            return True
        if hasattr(obj, 'has_stock'):
            return obj.has_stock > 0
            
        return obj.variants.filter(
            is_active=True, 
            deleted_at__isnull=True,
            stock_quantity__gt=0
        ).exists()


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for product detail (full information)"""
    category = CategorySerializer(read_only=True)
    variants = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'description', 'specifications',
            'sku', 'barcode', 'brand', 'category', 'is_quote_only',
            'manage_stock', 'status', 'is_featured', 'meta_title',
            'meta_description', 'weight_kg', 'length_cm', 'width_cm',
            'height_cm', 'views_count', 'sales_count', 'variants',
            'images', 'created_at', 'updated_at',
            'average_rating', 'review_count'
        ]
    
    def get_variants(self, obj):
        """Return only active, non-deleted variants"""
        active_variants = obj.variants.filter(
            is_active=True,
            deleted_at__isnull=True
        )
        return ProductVariantSerializer(active_variants, many=True).data
    
    def get_images(self, obj):
        """Return only non-deleted images, ordered by sort_order"""
        active_images = obj.images.filter(deleted_at__isnull=True).order_by('sort_order')
        return ProductImageSerializer(active_images, many=True).data
