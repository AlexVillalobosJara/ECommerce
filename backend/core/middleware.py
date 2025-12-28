from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Q
from tenants.models import Tenant


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to resolve tenant from subdomain or JWT token.
    
    For Admin API: Tenant is extracted from JWT token by TenantJWTAuthentication
    For Storefront: Tenant is extracted from subdomain
    """
    
    def process_request(self, request):
        # Get the host from the request
        host = request.get_host().split(':')[0].lower()  # Remove port and normalize to lowercase
        
        # Skip tenant resolution for global paths
        if request.path.startswith('/admin/') or request.path.startswith('/api/admin/'):
            if not hasattr(request, 'tenant'):
                request.tenant = None
            return None
        
        # 1. Try to match by custom domain first
        # We look for a tenant whose custom_domain matches the current host exactly
        # or matches host excluding 'www.'
        clean_host = host[4:] if host.startsWith('www.') else host
        
        try:
            # First, check if the host (completely or without www) is a custom domain
            tenant = Tenant.objects.filter(
                Q(custom_domain=host) | Q(custom_domain=clean_host),
                status='Active',
                deleted_at__isnull=True
            ).first()
            
            if tenant:
                request.tenant = tenant
                return None
        except Exception:
            pass

        # 2. Try to match by slug (subdomain)
        parts = host.split('.')
        tenant_slug = None
        
        # Logic for platform domains (localhost, onrender, vercel)
        platform_domains = ['localhost', 'onrender.com', 'vercel.app', 'railway.app']
        is_platform = any(d in host for d in platform_domains)
        
        if is_platform:
            # For slug.localhost or slug.onrender.com
            if len(parts) >= 2:
                # If it's something.localhost, slug is parts[0]
                # If it's something.onrender.com, slug is parts[0]
                potentially_slug = parts[0]
                if potentially_slug not in ['www', 'api', 'admin', 'localhost']:
                    tenant_slug = potentially_slug
        
        # 3. Fallback: tenant in query string (mainly for testing/local dev)
        if not tenant_slug and 'tenant' in request.GET:
            tenant_slug = request.GET.get('tenant')
            
        if tenant_slug:
            try:
                tenant = Tenant.objects.get(
                    slug=tenant_slug,
                    status='Active',
                    deleted_at__isnull=True
                )
                request.tenant = tenant
                return None
            except Tenant.DoesNotExist:
                pass
        
        # If we reach here, we didn't find a tenant
        # Return 404 for storefront API requests
        if request.path.startswith('/api/storefront/'):
            return JsonResponse({
                'error': 'Tenant not found',
                'detail': f'No active tenant found for host: {host}'
            }, status=404)
        
        request.tenant = None
        return None
