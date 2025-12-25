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
        # For now, use the first active tenant
        # TODO: Implement TenantUser model for multi-tenant user assignment
        try:
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
                token['tenant_slug'] = None
                token['tenant_name'] = None
        except Exception as e:
            token['tenant_id'] = None
            token['tenant_slug'] = None
            token['tenant_name'] = None
        
        return token


class TenantTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our tenant-aware serializer.
    """
    serializer_class = TenantTokenObtainPairSerializer
