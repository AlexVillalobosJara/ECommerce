from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Q
from .models import Category, Product, ProductVariant, ProductReview, ProductImage
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
        
        # Optimize with product count annotation and avoid recursive children queries in viewset if possible
        # However, CategorySerializer handles children. To optimize N+1 in children:
        from django.db.models import Count, Q
        
        queryset = Category.objects.filter(
            tenant=tenant,
            parent__isnull=True,
            is_active=True,
            deleted_at__isnull=True
        ).annotate(
            annotated_product_count=Count(
                'products', 
                filter=Q(products__status='Published', products__deleted_at__isnull=True),
                distinct=True
            )
        ).prefetch_related(
            models.Prefetch(
                'children',
                queryset=Category.objects.filter(is_active=True, deleted_at__isnull=True).order_by('sort_order')
            )
        ).order_by('sort_order', 'name')
        
        return queryset


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
        
        from django.db.models import Min, Max, Count, OuterRef, Subquery, Q
        
        # Subquery for primary image URL to avoid N+1 in serializer
        primary_image_subquery = ProductImage.objects.filter(
            product=OuterRef('pk'),
            is_primary=True,
            deleted_at__isnull=True
        ).values('url')[:1]

        # Calculate prices and counts in a single query
        queryset = Product.objects.filter(
            tenant=tenant,
            status='Published',
            deleted_at__isnull=True
        ).annotate(
            annotated_min_price=Min('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_max_price=Max('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_min_compare_price=Min('variants__compare_at_price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_variants_count=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True), distinct=True),
            annotated_primary_image=Subquery(primary_image_subquery),
            has_stock=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True, variants__stock_quantity__gt=0))
        ).select_related('category')
        
        if self.action == 'retrieve':
            queryset = queryset.prefetch_related(
                models.Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True, deleted_at__isnull=True)),
                models.Prefetch('images', queryset=ProductImage.objects.filter(deleted_at__isnull=True).order_by('sort_order'))
            )
        
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

