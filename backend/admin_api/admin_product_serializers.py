from rest_framework import serializers
from products.models import Category, Product, ProductVariant, ProductImage, ProductFeature


class CategoryListSerializer(serializers.ModelSerializer):
    """Serializer for category listing in admin"""
    products_count = serializers.IntegerField(source='annotated_products_count', read_only=True)
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


class ProductActivityAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage  # Temporary fix, will create dedicated class
        fields = '__all__'


class ProductFeatureAdminSerializer(serializers.ModelSerializer):
    """Serializer for product features (visual highlights)"""
    
    class Meta:
        model = ProductFeature
        fields = ['id', 'image_url', 'title', 'description', 'sort_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    primary_image = serializers.CharField(source='annotated_primary_image', read_only=True)
    min_price = serializers.FloatField(source='annotated_min_price', read_only=True)
    max_price = serializers.FloatField(source='annotated_max_price', read_only=True)
    variants_count = serializers.IntegerField(source='annotated_variants_count', read_only=True)
    in_stock = serializers.SerializerMethodField() # Keep this as logic is complex
    total_stock = serializers.IntegerField(source='annotated_total_stock', read_only=True)
    total_available = serializers.IntegerField(source='annotated_total_available', read_only=True)
    total_reserved = serializers.IntegerField(source='annotated_total_reserved', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'sku', 'brand', 'short_description', 'category_name',
                  'is_quote_only', 'is_featured', 'status', 'primary_image',
                  'min_price', 'max_price', 'variants_count', 'in_stock', 'total_stock',
                  'total_available', 'total_reserved', 'min_shipping_days', 'is_referential_image', 'created_at', 'updated_at', 'published_at']
    
    def get_in_stock(self, obj):
        # We can derive this from annotated_total_stock or custom field
        return (obj.annotated_total_stock or 0) > 0


class ProductDetailAdminSerializer(serializers.ModelSerializer):
    """Serializer for product detail/create/update in admin"""
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    variants = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
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
    
    def get_features(self, obj):
        """Return product features sorted by order"""
        features = obj.features.all().order_by('sort_order', 'created_at')
        return ProductFeatureAdminSerializer(features, many=True).data
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'short_description', 'description', 'specifications',
                  'sku', 'barcode', 'brand', 'category', 'category_id',
                  'is_quote_only', 'manage_stock', 'min_shipping_days', 'status', 'is_featured',
                  'is_referential_image',
                  'meta_title', 'meta_description', 'meta_keywords',
                  'weight_kg', 'length_cm', 'width_cm', 'height_cm',
                  'views_count', 'sales_count', 'variants', 'images', 'features', 'images_data',
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
        
        # Update images if provided (smart diffing)
        if images_data is not None:
            # 1. Map existing images by ID or URL to identify them
            existing_images = {str(img.id): img for img in instance.images.all()}
            
            # 2. Track processed IDs to identify deletions
            processed_ids = set()
            new_images_to_create = []
            
            for img_data in images_data:
                img_id = img_data.get('id')
                # If we have an ID and it exists, update it
                if img_id and str(img_id) in existing_images:
                    img_obj = existing_images[str(img_id)]
                    img_obj.alt_text = img_data.get('alt_text', '')
                    img_obj.sort_order = img_data.get('sort_order', 0)
                    img_obj.is_primary = img_data.get('is_primary', False)
                    img_obj.url = img_data.get('url', img_obj.url) # Ensure URL is kept or updated
                    img_obj.updated_by = request.user.id
                    img_obj.save()
                    processed_ids.add(str(img_id))
                
                # If no ID or ID not found (new image), prepare for creation
                else:
                    new_images_to_create.append(ProductImage(
                        product=product,
                        tenant_id=instance.tenant_id,
                        url=img_data.get('url'),
                        alt_text=img_data.get('alt_text', ''),
                        sort_order=img_data.get('sort_order', 0),
                        is_primary=img_data.get('is_primary', False),
                        created_by=request.user.id
                    ))
            
            # 3. Create new images in bulk
            if new_images_to_create:
                ProductImage.objects.bulk_create(new_images_to_create)
            
            # 4. Delete images that were not in the payload
            # (Only delete if images_data was actually passed, effectively syncing the list)
            for img_id, img_obj in existing_images.items():
                if img_id not in processed_ids:
                    img_obj.delete()
        
        return product
