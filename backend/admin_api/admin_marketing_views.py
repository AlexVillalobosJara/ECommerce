from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from tenants.marketing_config_models import TenantMarketingConfig
from .admin_marketing_serializers import TenantMarketingConfigSerializer
import logging

logger = logging.getLogger(__name__)


class TenantMarketingConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenant marketing configuration.
    Allows admin users to configure GTM, GA4, and other marketing integrations.
    """
    serializer_class = TenantMarketingConfigSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch']  # No create/delete, only get/update
    
    def get_queryset(self):
        """Return marketing config for current user's tenant"""
        tenant = getattr(self.request, 'tenant', None)
        
        if not tenant:
            return TenantMarketingConfig.objects.none()
        
        return TenantMarketingConfig.objects.filter(tenant=tenant)
    
    def get_object(self):
        """Get or create marketing config for tenant"""
        tenant = getattr(self.request, 'tenant', None)
        
        if not tenant:
            raise PermissionError("User must belong to a tenant")
        
        # Get or create marketing config for this tenant
        config, created = TenantMarketingConfig.objects.get_or_create(
            tenant=tenant,
            defaults={'is_active': True}
        )
        
        return config
    
    def list(self, request, *args, **kwargs):
        """
        Get marketing configuration for current tenant.
        Returns the tenant's marketing config or creates one if it doesn't exist.
        """
        try:
            config = self.get_object()
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Error retrieving marketing config: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve marketing configuration'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Update marketing configuration"""
        try:
            config = self.get_object()
            serializer = self.get_serializer(config, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Error updating marketing config: {e}", exc_info=True)
            return Response(
                {'error': 'Failed to update marketing configuration'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
