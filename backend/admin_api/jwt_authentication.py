from rest_framework_simplejwt.authentication import JWTAuthentication
from tenants.models import Tenant
import logging

logger = logging.getLogger(__name__)


class TenantJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that extracts tenant information from the token
    and attaches it to the request.
    
    This is the professional way to handle multi-tenancy in SaaS applications.
    """
    
    def authenticate(self, request):
        # Call parent authentication
        result = super().authenticate(request)
        
        if result is not None:
            user, validated_token = result
            
            # Extract tenant_id from token
            tenant_id = validated_token.get('tenant_id')
            logger.info(f'JWT Authentication - User: {user.username}, Tenant ID from token: {tenant_id}')
            
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(
                        id=tenant_id,
                        status='Active',
                        deleted_at__isnull=True
                    )
                    # Attach tenant to request
                    request.tenant = tenant
                    logger.info(f'Tenant attached to request: {tenant.slug}')
                except Tenant.DoesNotExist:
                    request.tenant = None
                    logger.warning(f'Tenant not found for ID: {tenant_id}')
            else:
                request.tenant = None
                logger.warning('No tenant_id in token')
        
        return result
