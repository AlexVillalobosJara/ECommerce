"""
Admin API views for shipping zones and communes
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from core.models import Commune
from orders.models import ShippingZone, ShippingCarrierConfig
from orders.serializers import ShippingZoneSerializer, CommuneSerializer, CommunesByRegionSerializer, ShippingCarrierConfigSerializer
from .admin_user_views import IsTenantAdmin
from rest_framework.permissions import IsAuthenticated


class AdminShippingZoneViewSet(viewsets.ModelViewSet):
    serializer_class = ShippingZoneSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    def get_queryset(self):
        tenant = self.request.tenant
        
        # Fallback: If no tenant in request (e.g. dev mode or token issue),
        # try to get the first active tenant
        if not tenant:
            from tenants.models import Tenant
            tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
            
        if not tenant:
            return ShippingZone.objects.none()
        
        return ShippingZone.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create shipping zone for current tenant"""
        tenant = self.request.tenant
        if not tenant:
            from tenants.models import Tenant
            tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        
        serializer.save(tenant=tenant)
    
    def perform_destroy(self, instance):
        """Soft delete shipping zone"""
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.save(update_fields=['deleted_at'])


class AdminShippingCarrierConfigViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for Shipping Carrier Configs
    """
    serializer_class = ShippingCarrierConfigSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]

    def get_queryset(self):
        tenant = self.request.tenant
        if not tenant:
             from tenants.models import Tenant
             tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        
        if not tenant:
            return ShippingCarrierConfig.objects.none()

        return ShippingCarrierConfig.objects.filter(tenant=tenant).order_by('carrier_name')

    def perform_create(self, serializer):
        tenant = self.request.tenant
        if not tenant:
             from tenants.models import Tenant
             tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
        serializer.save(tenant=tenant)



class CommuneViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for communes
    Provides list and by_region endpoints
    """
    serializer_class = CommuneSerializer
    queryset = Commune.objects.all().order_by('region_code', 'name')
    
    @action(detail=False, methods=['get'])
    def by_region(self, request):
        """
        Get communes grouped by region
        Returns: [{region_code, region_name, communes: [...]}, ...]
        """
        # Get all communes
        communes = Commune.objects.all().order_by('region_code', 'name')
        
        # Group by region
        regions = {}
        for commune in communes:
            if commune.region_code not in regions:
                regions[commune.region_code] = {
                    'region_code': commune.region_code,
                    'region_name': commune.region_name,
                    'communes': []
                }
            
            regions[commune.region_code]['communes'].append({
                'id': str(commune.id),
                'code': commune.code,
                'name': commune.name,
                'region_code': commune.region_code,
                'region_name': commune.region_name
            })
        
        # Convert to list and sort by region code
        result = sorted(regions.values(), key=lambda x: x['region_code'])
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search communes by name
        Query params: q (search query)
        """
        query = request.query_params.get('q', '').strip()
        
        if not query:
            return Response([])
        
        communes = Commune.objects.filter(
            Q(name__icontains=query) | Q(region_name__icontains=query)
        ).order_by('region_code', 'name')[:50]  # Limit to 50 results
        
        serializer = self.get_serializer(communes, many=True)
        return Response(serializer.data)
