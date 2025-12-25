from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from tenants.models import Tenant


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to resolve tenant from subdomain or JWT token.
    
    For Admin API: Tenant is extracted from JWT token by TenantJWTAuthentication
    For Storefront: Tenant is extracted from subdomain
    """
    
    def process_request(self, request):
        # Get the host from the request
        host = request.get_host().split(':')[0]  # Remove port if present
        
        # Extract subdomain
        # For development: tenant1.localhost
        # For production: tenant1.yourdomain.com
        parts = host.split('.')
        
        # Skip tenant resolution for Django admin panel
        if request.path.startswith('/admin/'):
            request.tenant = None
            return None
        
        # For admin API, tenant is set by TenantJWTAuthentication
        # We don't need to do anything here, just skip
        if request.path.startswith('/api/admin/'):
            # Tenant will be set by JWT authentication
            # If not set, it means user is not authenticated yet
            if not hasattr(request, 'tenant'):
                request.tenant = None
            return None
        
        # Determine tenant slug for storefront
        tenant_slug = None
        
        if len(parts) >= 2:
            # Has subdomain
            tenant_slug = parts[0]
        elif 'tenant' in request.GET:
            # Fallback: tenant in query string (for testing)
            tenant_slug = request.GET.get('tenant')
        
        if not tenant_slug or tenant_slug in ['www', 'api', 'admin']:
            # No tenant or reserved subdomain
            request.tenant = None
            return None
        
        # Look up tenant
        try:
            tenant = Tenant.objects.get(
                slug=tenant_slug,
                status='Active',
                deleted_at__isnull=True
            )
            request.tenant = tenant
        except Tenant.DoesNotExist:
            # Tenant not found - return 404 for storefront requests
            if request.path.startswith('/api/storefront/'):
                return JsonResponse({
                    'error': 'Tenant not found',
                    'detail': f'No active tenant found for slug: {tenant_slug}'
                }, status=404)
            request.tenant = None
        
        return None
