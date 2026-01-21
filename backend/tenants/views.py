from rest_framework import viewsets, filters, views
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.db.models import Q, Min, Max, Count, OuterRef, Subquery, Exists, F
from .models import Tenant, PremiumPalette
from .serializers import TenantSerializer, PremiumPaletteSerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from products.models import Category, Product, ProductImage, ProductVariant
from products.serializers import CategorySerializer, ProductListSerializer, ProductDetailSerializer
from django.core.cache import cache

class PremiumPaletteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PremiumPalette CRUD.
    Restricted to superadmins or staff users.
    """
    queryset = PremiumPalette.objects.filter(is_active=True)
    serializer_class = PremiumPaletteSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['name']

class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'email']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Tenant.objects.filter(deleted_at__isnull=True)
        slug = self.request.query_params.get('slug')
        domain = self.request.query_params.get('domain')
        
        if slug:
            queryset = queryset.filter(slug=slug)
        elif domain:
            queryset = queryset.filter(custom_domain=domain)
            
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.save()
        return Response(status=204)

class StorefrontBaseView(views.APIView):
    permission_classes = []
    
    def resolve_tenant(self, request):
        slug = request.query_params.get('slug')
        domain = request.query_params.get('domain')
        
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            if slug:
                tenant = Tenant.objects.filter(slug=slug, deleted_at__isnull=True, status__in=['Active', 'Trial']).first()
            elif domain:
                tenant = Tenant.objects.filter(custom_domain=domain, deleted_at__isnull=True, status__in=['Active', 'Trial']).first()
        
        if tenant:
            request.tenant = tenant
        return tenant

    def get_common_data(self, request, tenant):
        cache_key = f"storefront_common_data_{tenant.id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data['tenant'], cached_data['categories']

        # 1. Tenant Data
        tenant_data = TenantSerializer(tenant, context={'request': request}).data
        
        # 2. Categories Data (Top level)
        categories_qs = Category.objects.filter(
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
        categories_data = CategorySerializer(categories_qs, many=True, context={'request': request}).data
        
        # Cache Static Data for 1 Hour (3600s)
        cache.set(cache_key, {'tenant': tenant_data, 'categories': categories_data}, 3600)
        return tenant_data, categories_data

    def get_annotated_products_queryset(self, tenant):
        base_products = Product.objects.filter(
            tenant=tenant,
            status='Published',
            deleted_at__isnull=True
        )
        primary_image_subquery = ProductImage.objects.filter(
            product=OuterRef('pk'),
            is_primary=True,
            deleted_at__isnull=True
        ).values('url')[:1]

        return base_products.annotate(
            annotated_min_price=Min('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_max_price=Max('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_min_compare_price=Min('variants__compare_at_price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_variants_count=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True), distinct=True),
            annotated_primary_image=Subquery(primary_image_subquery),
            has_stock=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True, variants__stock_quantity__gt=0)),
            annotated_has_discount=Exists(
                ProductVariant.objects.filter(
                    product=OuterRef('pk'),
                    is_active=True,
                    deleted_at__isnull=True
                ).exclude(price=F('compare_at_price'))
            )
        ).select_related('category')

class StorefrontHomeView(StorefrontBaseView):
    def get(self, request, *args, **kwargs):
        tenant = self.resolve_tenant(request)
        if not tenant:
            return Response({"error": "Tenant not found"}, status=404)

        # Full Page Cache (Invalidated by Signals via Versioning)
        from core.cache_utils import get_versioned_cache_key
        
        base_key = f"storefront_home_data_{tenant.id}"
        # Use 'home_data' scope
        cache_key = get_versioned_cache_key(base_key, 'home_data', tenant.id)
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        tenant_data, categories_data = self.get_common_data(request, tenant)
        products_qs = self.get_annotated_products_queryset(tenant)
        
        featured_qs = products_qs.filter(is_featured=True)
        display_qs = featured_qs
        if not display_qs.exists():
            display_qs = products_qs.order_by('-created_at')[:12]
        else:
            display_qs = featured_qs.order_by('-created_at')
            
        products_data = ProductListSerializer(display_qs, many=True, context={'request': request}).data
        
        response_data = {
            "tenant": tenant_data,
            "categories": categories_data,
            "featured_products": products_data
        }
        
        # Cache for 1 Hour (Signal Invalidation handles updates)
        cache.set(cache_key, response_data, 3600)
        return Response(response_data)

class StorefrontCategoryView(StorefrontBaseView):
    def get(self, request, *args, **kwargs):
        tenant = self.resolve_tenant(request)
        category_slug = request.query_params.get('category_slug')
        if not tenant:
            return Response({"error": "Tenant not found"}, status=404)
        if not category_slug:
            return Response({"error": "Category slug required"}, status=400)

        # Build cache key from all relevant parameters
        params_str = "&".join([f"{k}={v}" for k, v in sorted(request.query_params.items())])
        base_key = f"storefront_category_data_{tenant.id}_{category_slug}_{params_str}"
        
        # Use 'categories' scope (general category updates invalidate this)
        # We could be more specific ('category_slug'), but 'categories' scope aligns with list updates
        from core.cache_utils import get_versioned_cache_key
        cache_key = get_versioned_cache_key(base_key, 'categories', tenant.id)
        
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        tenant_data, categories_data = self.get_common_data(request, tenant)
        
        # Category Detail
        category = Category.objects.filter(tenant=tenant, slug=category_slug, deleted_at__isnull=True).first()
        if not category:
            return Response({"error": "Category not found"}, status=404)
        category_data = CategorySerializer(category, context={'request': request}).data

        # Category Products
        products_qs = self.get_annotated_products_queryset(tenant).filter(category=category)
        
        # Apply other filters from query params
        min_price = request.query_params.get('min_price')
        if min_price:
            products_qs = products_qs.filter(variants__price__gte=min_price).distinct()
            
        max_price = request.query_params.get('max_price')
        if max_price:
            products_qs = products_qs.filter(variants__price__lte=max_price).distinct()
            
        ordering = request.query_params.get('ordering')
        if ordering:
            products_qs = products_qs.order_by(ordering)
        else:
            products_qs = products_qs.order_by('-created_at')

        products_data = ProductListSerializer(products_qs, many=True, context={'request': request}).data
        
        response_data = {
            "tenant": tenant_data,
            "categories": categories_data,
            "category": category_data,
            "products": products_data
        }
        
        # Cache for 1 Hour (Signal Invalidation handles updates)
        cache.set(cache_key, response_data, 3600)
        return Response(response_data)

class StorefrontProductDetailView(StorefrontBaseView):
    def get(self, request, *args, **kwargs):
        tenant = self.resolve_tenant(request)
        product_slug = request.query_params.get('product_slug')
        if not tenant:
            return Response({"error": "Tenant not found"}, status=404)
        if not product_slug:
            return Response({"error": "Product slug required"}, status=400)

        tenant_data, categories_data = self.get_common_data(request, tenant)
        
        # Product Detail (Cache by Tenant + Slug)
        product_cache_key = f"storefront_product_{tenant.id}_{product_slug}"
        cached_product = cache.get(product_cache_key)
        
        if cached_product:
            product_data = cached_product['product']
            related_data = cached_product['related']
        else:
            product_qs = Product.objects.filter(tenant=tenant, slug=product_slug, deleted_at__isnull=True).prefetch_related(
                models.Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True, deleted_at__isnull=True)),
                models.Prefetch('images', queryset=ProductImage.objects.filter(deleted_at__isnull=True).order_by('sort_order'))
            ).select_related('category')
            
            product = product_qs.first()
            if not product:
                return Response({"error": "Product not found"}, status=404)
                
            product_data = ProductDetailSerializer(product, context={'request': request}).data

            # Related Products (Same category)
            related_qs = self.get_annotated_products_queryset(tenant).filter(
                category=product.category
            ).exclude(id=product.id).order_by('-created_at')[:4]
            
            related_data = ProductListSerializer(related_qs, many=True, context={'request': request}).data
            
            # Cache for 1 Hour (Signal Invalidation handles updates)
            cache.set(product_cache_key, {'product': product_data, 'related': related_data}, 3600)
        
        return Response({
            "tenant": tenant_data,
            "categories": categories_data,
            "product": product_data,
            "related_products": related_data
        })