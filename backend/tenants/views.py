from rest_framework import viewsets, filters, views
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.db.models import Q
from .models import Tenant
from .serializers import TenantSerializer
from products.models import Category, Product, ProductImage, ProductVariant
from products.serializers import CategorySerializer, ProductListSerializer
from django.db.models import Min, Max, Count, OuterRef, Subquery, Q

class TenantViewSet(viewsets.ModelViewSet):
    # ... (existing code managed by multi_replace if needed, but simple append/refactor is fine)
    # Actually, I'll just append and fix imports properly.
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

class StorefrontHomeView(views.APIView):
    """
    Mega-endpoint to fetch all data needed for the storefront home page in a single RTT.
    Returns: Tenant Config, Categories, and Featured Products.
    """
    permission_classes = [] # Publicly accessible
    
    def get(self, request, *args, **kwargs):
        # Resolve tenant using existing middleware or params
        slug = request.query_params.get('slug')
        domain = request.query_params.get('domain')
        
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"StorefrontHomeView: resolving for slug='{slug}', domain='{domain}'")
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            if slug:
                tenant = Tenant.objects.filter(slug=slug, deleted_at__isnull=True, status__in=['Active', 'Trial']).first()
            elif domain:
                tenant = Tenant.objects.filter(custom_domain=domain, deleted_at__isnull=True, status__in=['Active', 'Trial']).first()
        
        if not tenant:
            logger.warning(f"StorefrontHomeView: Tenant NOT FOUND for slug='{slug}', domain='{domain}'")
            return Response({"error": "Tenant not found"}, status=404)
        
        logger.info(f"StorefrontHomeView: Resolved tenant '{tenant.slug}' (ID: {tenant.id})")
        
        # Explicitly set request.tenant for internal ViewSet/get_queryset calls
        request.tenant = tenant
        
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
        
        # 3. Featured Products Data
        # Base filters for all storefront products
        base_products = Product.objects.filter(
            tenant=tenant,
            status='Published',
            deleted_at__isnull=True
        )
        
        # Subquery for primary image URL
        primary_image_subquery = ProductImage.objects.filter(
            product=OuterRef('pk'),
            is_primary=True,
            deleted_at__isnull=True
        ).values('url')[:1]

        # Annotations (matching StorefrontProductViewSet)
        products_qs = base_products.annotate(
            annotated_min_price=Min('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_max_price=Max('variants__price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_min_compare_price=Min('variants__compare_at_price', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True)),
            annotated_variants_count=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True), distinct=True),
            annotated_primary_image=Subquery(primary_image_subquery),
            has_stock=Count('variants', filter=Q(variants__is_active=True, variants__deleted_at__isnull=True, variants__stock_quantity__gt=0))
        ).select_related('category')
        
        featured_qs = products_qs.filter(is_featured=True)
        
        # Fallback logic
        display_qs = featured_qs
        if not display_qs.exists():
            display_qs = products_qs.order_by('-created_at')[:12] # Fallback to 12 if none featured
        else:
            display_qs = featured_qs.order_by('-created_at') # Show ALL featured
            
        products_data = ProductListSerializer(display_qs, many=True, context={'request': request}).data
        
        return Response({
            "tenant": tenant_data,
            "categories": categories_data,
            "featured_products": products_data,
            "_debug": {
                "total_published": base_products.count(),
                "total_featured": featured_qs.count(),
                "tenant_resolved": tenant.slug
            }
        })
