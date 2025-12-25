from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Product, ProductVariant, ProductReview
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductVariantWriteSerializer
)


class StorefrontCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Storefront API for categories.
    Read-only, filtered by tenant.
    """
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return Category.objects.none()
        
        # Only return top-level categories (parent=None)
        # Children are included in the serializer
        return Category.objects.filter(
            tenant=tenant,
            parent__isnull=True,
            is_active=True,
            deleted_at__isnull=True
        ).order_by('sort_order', 'name')


class StorefrontProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Storefront API for products.
    Read-only, filtered by tenant.
    Supports search and filtering.
    """
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'brand', 'sku']
    ordering_fields = ['name', 'created_at', 'sales_count']
    ordering = ['-created_at']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return Product.objects.none()
        
        queryset = Product.objects.filter(
            tenant=tenant,
            status='Published',
            deleted_at__isnull=True
        ).select_related('category').prefetch_related('variants', 'images')
        
        # Filter by category
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Filter by featured
        is_featured = self.request.query_params.get('featured')
        if is_featured == 'true':
            queryset = queryset.filter(is_featured=True)
        
        # Filter by in stock
        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            queryset = queryset.filter(
                Q(manage_stock=False) |
                Q(variants__stock_quantity__gt=0, variants__is_active=True)
            ).distinct()
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price or max_price:
            price_filter = Q(is_quote_only=False)
            if min_price:
                price_filter &= Q(variants__price__gte=min_price)
            if max_price:
                price_filter &= Q(variants__price__lte=max_price)
            queryset = queryset.filter(price_filter).distinct()
        
        # Filter by exclude (e.g. for related products, exclude current)
        exclude_id = self.request.query_params.get('exclude')
        if exclude_id:
            queryset = queryset.exclude(id=exclude_id)

        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count when product is viewed"""
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product variants.
    Nested under products: /products/{product_id}/variants/
    """
    serializer_class = ProductVariantWriteSerializer
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return ProductVariant.objects.none()
        
        product_id = self.kwargs.get('product_pk')
        
        return ProductVariant.objects.filter(
            tenant=tenant,
            product_id=product_id,
            deleted_at__isnull=True
        )
    
    def perform_create(self, serializer):
        """Create variant with product and tenant from context"""
        product_id = self.kwargs.get('product_pk')
        product = Product.objects.get(id=product_id, tenant=self.request.tenant)
        serializer.save(product=product, tenant=self.request.tenant)
    
    def perform_destroy(self, instance):
        """Soft delete variant"""
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save()


class ProductReviewViewSet(viewsets.ModelViewSet):
    """
    Storefront API for product reviews.
    Allows listing reviews for a product and creating new ones.
    Nested under products: /products/{product_slug}/reviews/
    """
    from .serializers import ProductReviewSerializer
    serializer_class = ProductReviewSerializer
    
    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
            return ProductReview.objects.none()
            
        product_slug = self.kwargs.get('product_slug')
        
        return ProductReview.objects.filter(
            tenant=tenant,
            product__slug=product_slug,
            is_approved=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create review for specific product"""
        tenant = self.request.tenant
        product_slug = self.kwargs.get('product_slug')
        product = Product.objects.get(tenant=tenant, slug=product_slug)
        
        # Auto-approve for demo purposes (or check tenant config)
        serializer.save(
            tenant=tenant,
            product=product,
            is_approved=True 
        )

