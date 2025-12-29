from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Q
from tenants.models import Tenant
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to resolve tenant from subdomain or JWT token.
    
    For Admin API: Tenant is extracted from JWT token by TenantJWTAuthentication
    For Storefront: Tenant is extracted from subdomain
    """
    
    def process_request(self, request):
        try:
            # Get the host from the request
            host = request.get_host().split(':')[0].lower()  # Remove port and normalize to lowercase
            logger.info(f"TenantMiddleware resolving host: {host}")
            
            # Skip tenant resolution for global paths
            if request.path.startswith('/admin/') or request.path.startswith('/api/admin/'):
                if not hasattr(request, 'tenant'):
                    request.tenant = None
                return None
            
            # 1. Try to match by custom domain first
            # We look for a tenant whose custom_domain matches the current host exactly
            # or matches host excluding 'www.'
            clean_host = host[4:] if host.startswith('www.') else host
            
            # First, check if the host (completely or without www) is a custom domain
            try:
                tenant = Tenant.objects.filter(
                    Q(custom_domain=host) | Q(custom_domain=clean_host),
                    status='Active',
                    deleted_at__isnull=True
                ).first()
                
                if tenant:
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by domain: {tenant.slug}")
                    return None
            except Exception as inner_e:
                logger.warning(f"Error in custom domain lookup: {str(inner_e)}")
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
                    potentially_slug = parts[0]
                    if potentially_slug not in ['www', 'api', 'admin', 'localhost']:
                        tenant_slug = potentially_slug
            else:
                # SaaS Fallback: Check if the clean host is exactly a slug
                # This handles cases like doctorinox.cl where doctorinox.cl IS the slug
                tenant_slug = clean_host
            
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
                    logger.info(f"Tenant resolved by slug: {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.info(f"No tenant found for slug: {tenant_slug}")
                    pass
                except Exception as inner_e:
                    logger.error(f"Error in slug lookup: {str(inner_e)}")
                    pass
            
            # If we reach here, we didn't find a tenant
            # Return 404 for storefront API requests
            if request.path.startswith('/api/storefront/'):
                logger.warning(f"Tenant not found for storefront request: {host}")
                return JsonResponse({
                    'error': 'Tenant not found',
                    'detail': f'No active tenant found for host: {host}'
                }, status=404)
            
            request.tenant = None
            return None

        except Exception as e:
            logger.error(f"CRITICAL Error in TenantMiddleware: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            
            if request.path.startswith('/api/'):
                return JsonResponse({
                    'error': 'Internal Server Error',
                    'detail': f'Error resolving tenant: {str(e)}'
                }, status=500)
            # Re-raise for non-API requests
            raise e
