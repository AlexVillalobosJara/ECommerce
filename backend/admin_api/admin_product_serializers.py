from rest_framework import serializers
from products.models import Category, Product, ProductVariant, ProductImage


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializer for category listing in admin"""
    products_count = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'icon', 
                  'sort_order', 'is_active', 'products_count', 'children', 'path', 'parent']
    
    def get_products_count(self, obj):
        """Count only non-deleted products"""
        return obj.products.filter(deleted_at__isnull=True).count()
    
    def get_children(self, obj):
        """Get non-deleted child categories - return IDs only to avoid recursion"""
        children = obj.children.filter(deleted_at__isnull=True).order_by('sort_order', 'name')
        # Return simple list of child data without recursive nesting
        return [{'id': str(child.id), 'name': child.name, 'slug': child.slug} for child in children]
    
    def get_path(self, obj):
        """Get full category path (e.g., 'Cocina > Utensilios')"""
        path = []
        current = obj
        visited = set()
        max_depth = 10
        
        while current and len(path) < max_depth:
            if current.id in visited:
                break
            visited.add(current.id)
            path.insert(0, current.name)
            current = current.parent
        return ' > '.join(path)


class CategoryDetailSerializer(serializers.ModelSerializer):
    """Serializer for category create/update in admin"""
    products_count = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'icon',
                  'sort_order', 'is_active', 'parent', 'meta_title', 'meta_description',
                  'products_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_products_count(self, obj):
        """Count only non-deleted products"""
        return obj.products.filter(deleted_at__isnull=True).count()
    
    def create(self, validated_data):
        """Create category with tenant and audit info"""
        request = self.context.get('request')
        validated_data['tenant_id'] = request.tenant.id
        validated_data['created_by'] = request.user.id
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update category with audit info"""
        request = self.context.get('request')
        validated_data['updated_by'] = request.user.id
        return super().update(instance, validated_data)


class ProductImageAdminSerializer(serializers.ModelSerializer):
    """Serializer for product images in admin"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'alt_text', 'sort_order', 'is_primary', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductVariantAdminSerializer(serializers.ModelSerializer):
    """Serializer for product variants in admin"""
    available_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'barcode', 'name', 'attributes', 'price', 
                  'compare_at_price', 'cost', 'stock_quantity', 'reserved_quantity',
                  'available_stock', 'low_stock_threshold', 'is_active', 
                  'is_default', 'image_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'available_stock', 'created_at', 'updated_at']


class ProductListAdminSerializer(serializers.ModelSerializer):
    """Serializer for product listing in admin"""
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    primary_image = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    variants_count = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()
    total_available = serializers.SerializerMethodField()
    total_reserved = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'sku', 'brand', 'short_description', 'category_name',
                  'is_quote_only', 'is_featured', 'status', 'primary_image',
                  'min_price', 'max_price', 'variants_count', 'in_stock', 'total_stock',
                  'total_available', 'total_reserved', 'created_at', 'updated_at', 'published_at']
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True, deleted_at__isnull=True).first()
        if primary:
            return primary.url
        first = obj.images.filter(deleted_at__isnull=True).order_by('sort_order').first()
        return first.url if first else None
    
    def get_min_price(self, obj):
        if obj.is_quote_only:
            return None
        variants = obj.variants.filter(is_active=True, deleted_at__isnull=True, price__isnull=False)
        prices = [v.price for v in variants if v.price]
        return float(min(prices)) if prices else None
    
    def get_max_price(self, obj):
        if obj.is_quote_only:
            return None
        variants = obj.variants.filter(is_active=True, deleted_at__isnull=True, price__isnull=False)
        prices = [v.price for v in variants if v.price]
        return float(max(prices)) if prices else None
    
    def get_variants_count(self, obj):
        return obj.variants.filter(is_active=True, deleted_at__isnull=True).count()
    
    def get_in_stock(self, obj):
        if not obj.manage_stock:
            return True
        return obj.variants.filter(
            is_active=True, 
            deleted_at__isnull=True,
            stock_quantity__gt=0
        ).exists()
    
    def get_total_stock(self, obj):
        if obj.is_quote_only or not obj.manage_stock:
            return None
        return sum(v.stock_quantity for v in obj.variants.filter(
            is_active=True, 
            deleted_at__isnull=True
        ))

    def get_total_available(self, obj):
        if obj.is_quote_only or not obj.manage_stock:
            return None
        return sum(v.available_stock for v in obj.variants.filter(
            is_active=True, 
            deleted_at__isnull=True
        ))

    def get_total_reserved(self, obj):
        if obj.is_quote_only or not obj.manage_stock:
            return None
        return sum(v.reserved_quantity for v in obj.variants.filter(
            is_active=True, 
            deleted_at__isnull=True
        ))


class ProductDetailAdminSerializer(serializers.ModelSerializer):
    """Serializer for product detail/create/update in admin"""
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    variants = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    images_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="Array of image objects with url, alt_text, sort_order, is_primary"
    )
    
    def get_variants(self, obj):
        """Return only non-deleted variants"""
        active_variants = obj.variants.filter(deleted_at__isnull=True)
        return ProductVariantAdminSerializer(active_variants, many=True).data
    
    def get_images(self, obj):
        """Return only non-deleted images"""
        active_images = obj.images.filter(deleted_at__isnull=True)
        return ProductImageAdminSerializer(active_images, many=True).data
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'short_description', 'description', 'specifications',
                  'sku', 'barcode', 'brand', 'category', 'category_id',
                  'is_quote_only', 'manage_stock', 'status', 'is_featured',
                  'meta_title', 'meta_description', 'meta_keywords',
                  'weight_kg', 'length_cm', 'width_cm', 'height_cm',
                  'views_count', 'sales_count', 'variants', 'images', 'images_data',
                  'created_at', 'updated_at', 'published_at']
        read_only_fields = ['id', 'views_count', 'sales_count', 'created_at', 
                            'updated_at', 'published_at']
    
    def create(self, validated_data):
        # Get tenant from request context
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None)
        
        # Fallback if tenant missing (common in some production scenarios)
        if not tenant and request.user.is_authenticated:
            from tenants.models import TenantUser, Tenant
            # Priority 1: TenantUser
            tenant_user = TenantUser.objects.filter(user=request.user, is_active=True).first()
            if tenant_user:
                tenant = tenant_user.tenant
            
            # Priority 2: Superuser fallback (first active tenant)
            if not tenant and request.user.is_superuser:
                tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()

        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "No se pudo determinar el comercio (tenant)."})

        validated_data['tenant_id'] = tenant.id
        validated_data['created_by'] = request.user.id
        
        # Handle category_id
        category_id = validated_data.pop('category_id', None)
        if category_id:
            validated_data['category_id'] = category_id
        
        # Extract images_data before creating product
        images_data = validated_data.pop('images_data', [])
        
        # Create product
        product = super().create(validated_data)
        
        # Create images from Supabase URLs
        for img_data in images_data:
            ProductImage.objects.create(
                product=product,
                tenant_id=tenant.id,
                url=img_data.get('url'),
                alt_text=img_data.get('alt_text', ''),
                sort_order=img_data.get('sort_order', 0),
                is_primary=img_data.get('is_primary', False),
                created_by=request.user.id
            )
        
        return product
    
    def update(self, instance, validated_data):
        # Track who updated
        request = self.context.get('request')
        validated_data['updated_by'] = request.user.id
        
        # Handle category_id
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            validated_data['category_id'] = category_id
        
        # Extract images_data before updating product
        images_data = validated_data.pop('images_data', None)
        
        # Update product
        product = super().update(instance, validated_data)
        
        # Update images if provided
        if images_data is not None:
            # Delete existing images
            instance.images.all().delete()
            
            # Create new images from Supabase URLs
            for img_data in images_data:
                ProductImage.objects.create(
                    product=product,
                    tenant_id=instance.tenant_id,
                    url=img_data.get('url'),
                    alt_text=img_data.get('alt_text', ''),
                    sort_order=img_data.get('sort_order', 0),
                    is_primary=img_data.get('is_primary', False),
                    created_by=request.user.id
                )
        
        return product
