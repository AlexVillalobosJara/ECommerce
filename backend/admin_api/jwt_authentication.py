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
                    logger.info(f'Tenant attached to request from token: {tenant.slug}')
                except Tenant.DoesNotExist:
                    request.tenant = None
                    logger.warning(f'Tenant not found for ID: {tenant_id}')
            else:
                # Fallback: Resolve via TenantUser relationship for the authenticated user
                from tenants.models import TenantUser
                try:
                    tenant_user = TenantUser.objects.filter(
                        user=user,
                        is_active=True,
                        tenant__status='Active',
                        tenant__deleted_at__isnull=True
                    ).select_related('tenant').first()
                    
                    if tenant_user:
                        request.tenant = tenant_user.tenant
                        logger.info(f'Tenant attached from TenantUser: {request.tenant.slug}')
                    elif user.is_superuser:
                        # Superuser fallback: Use the first active tenant
                        tenant = Tenant.objects.filter(
                            status='Active',
                            deleted_at__isnull=True
                        ).first()
                        request.tenant = tenant
                        if tenant:
                            logger.info(f'Tenant attached via superuser fallback: {tenant.slug}')
                    else:
                        request.tenant = None
                        logger.warning(f'No tenant found for user: {user.username}')
                except Exception as e:
                    request.tenant = None
                    logger.error(f'Error resolving tenant fallback: {str(e)}')
        
        return result
