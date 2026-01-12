from rest_framework import viewsets, filters, views
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Tenant
from .serializers import TenantSerializer
from products.models import Category, Product
from products.serializers import CategorySerializer, ProductListSerializer
from products.views import StorefrontProductViewSet, StorefrontCategoryViewSet

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
        tenant = getattr(request, 'tenant', None)
        slug = request.query_params.get('slug')
        domain = request.query_params.get('domain')
        
        if not tenant:
            if slug:
                tenant = Tenant.objects.filter(slug=slug, deleted_at__isnull=True, status='Active').first()
            elif domain:
                tenant = Tenant.objects.filter(custom_domain=domain, deleted_at__isnull=True, status='Active').first()
        
        if not tenant:
            return Response({"error": "Tenant not found"}, status=404)
        
        # 1. Tenant Data
        tenant_data = TenantSerializer(tenant).data
        
        # 2. Categories Data (Top level)
        # We reuse the logic from StorefrontCategoryViewSet but manually
        cat_viewset = StorefrontCategoryViewSet()
        cat_viewset.request = request
        cat_viewset.request.tenant = tenant
        categories_qs = cat_viewset.get_queryset()
        categories_data = CategorySerializer(categories_qs, many=True).data
        
        # 3. Featured Products Data
        # We reuse the logic from StorefrontProductViewSet
        prod_viewset = StorefrontProductViewSet()
        prod_viewset.request = request
        prod_viewset.request.tenant = tenant
        products_qs = prod_viewset.get_queryset().filter(is_featured=True)
        products_data = ProductListSerializer(products_qs, many=True).data
        
        return Response({
            "tenant": tenant_data,
            "categories": categories_data,
            "featured_products": products_data
        })
