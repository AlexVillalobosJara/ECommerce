from rest_framework import viewsets, filters
from rest_framework.response import Response
from django.utils import timezone
from .models import Tenant
from .serializers import TenantSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tenant CRUD operations
    """
    serializer_class = TenantSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'email']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Exclude soft-deleted tenants and filter by slug if provided"""
        queryset = Tenant.objects.filter(deleted_at__isnull=True)
        slug = self.request.query_params.get('slug')
        if slug:
            queryset = queryset.filter(slug=slug)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete instead of hard delete"""
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.save()
        return Response(status=204)
