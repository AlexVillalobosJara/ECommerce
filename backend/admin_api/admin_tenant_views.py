from rest_framework import viewsets, permissions, status, filters
from rest_framework.response import Response
from django.utils import timezone
from tenants.models import Tenant
from .admin_tenant_serializers import AdminTenantSerializer

from django.core.cache import cache

class IsSuperUser(permissions.BasePermission):
    """
    Allows access only to superusers.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)

class AdminTenantViewSet(viewsets.ModelViewSet):
    """
    CRUD for Tenants, only for superadmins.
    """
    queryset = Tenant.objects.filter(deleted_at__isnull=True)
    serializer_class = AdminTenantSerializer
    permission_classes = [IsSuperUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'slug', 'legal_name', 'tax_id', 'email']
    ordering_fields = ['created_at', 'name', 'status']
    ordering = ['-created_at']

    def perform_update(self, serializer):
        tenant = serializer.save()
        # Invalidate storefront caches
        cache_keys = [
            f"storefront_common_data_{tenant.id}",
            f"storefront_home_data_{tenant.id}",
        ]
        # Products and Category pages are also cached by tenant ID
        # For simplicity, we can clear common ones or use a more holistic approach
        # Category views use parameters in the key, so it's harder to list them all
        # but common_data and home_data are the most critical for immediate branding visibility
        cache.delete_many(cache_keys)
        return tenant

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Soft delete
        instance.deleted_at = timezone.now()
        instance.status = 'Cancelled'
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
