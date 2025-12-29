from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from tenants.models import Tenant


class TenantTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer that includes tenant information in the token.
    This is the correct way to handle multi-tenancy in SaaS applications.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        
        # Add tenant information
        # Better: find the tenant assigned to this user in TenantUser
        from tenants.models import TenantUser
        try:
            # Get the first tenant user relationship for this user
            tenant_user = TenantUser.objects.filter(
                user=user,
                is_active=True,
                tenant__status='Active',
                tenant__deleted_at__isnull=True
            ).select_related('tenant').first()
            
            if tenant_user:
                tenant = tenant_user.tenant
                token['tenant_id'] = str(tenant.id)
                token['tenant_slug'] = tenant.slug
                token['tenant_name'] = tenant.name
            else:
                # Fallback for superusers who might not have a TenantUser record
                if user.is_superuser:
                    tenant = Tenant.objects.filter(
                        status='Active',
                        deleted_at__isnull=True
                    ).first()
                    if tenant:
                        token['tenant_id'] = str(tenant.id)
                        token['tenant_slug'] = tenant.slug
                        token['tenant_name'] = tenant.name
                    else:
                        token['tenant_id'] = None
                else:
                    token['tenant_id'] = None
                    token['tenant_slug'] = None
                    token['tenant_name'] = None
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error resolving tenant in JWT: {str(e)}")
            token['tenant_id'] = None
        
        return token


class TenantTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our tenant-aware serializer.
    """
    serializer_class = TenantTokenObtainPairSerializer
