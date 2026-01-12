from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Q
from tenants.models import Tenant
import logging

logger = logging.getLogger(__name__)


class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to resolve tenant from domain, subdomain, or query parameter.
    
    Priority:
    1. Custom Domain Match (host matches custom_domain field)
    2. Query Parameter (?tenant=slug)
    3. Platform Subdomain (slug.onrender.com)
    4. SaaS Fallback (host itself is the slug)
    """
    
    def process_request(self, request):
        try:
            # Get the host from the request
            host = request.get_host().split(':')[0].lower()  # Remove port and normalize to lowercase
            logger.info(f"TenantMiddleware resolving host: {host}")
            
            # Skip tenant resolution for global Django admin (if any)
            if request.path.startswith('/admin/'):
                if not hasattr(request, 'tenant'):
                    request.tenant = None
                return None
            
            # 0. Try to match by X-Tenant header (High priority for cross-domain API calls)
            header_tenant_slug = request.headers.get('X-Tenant')
            if header_tenant_slug:
                try:
                    # Allow matching by slug or custom_domain in header
                    tenant = Tenant.objects.get(
                        Q(slug=header_tenant_slug) | Q(custom_domain=header_tenant_slug),
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    )
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by X-Tenant header: {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.warning(f"Tenant not found for X-Tenant header: {header_tenant_slug}")
            
            # 1. Try to match by custom domain first
            clean_host = host[4:] if host.startswith('www.') else host
            try:
                tenant = Tenant.objects.filter(
                    Q(custom_domain=host) | Q(custom_domain=clean_host),
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).first()
                
                if tenant:
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by domain: {tenant.slug}")
                    return None
            except Exception as inner_e:
                logger.warning(f"Error in custom domain lookup: {str(inner_e)}")

            # 2. Try to match by query parameter (High priority for cross-domain/testing)
            tenant_slug = request.GET.get('tenant')
            if tenant_slug:
                try:
                    # Allow matching by slug or custom_domain in query param
                    tenant = Tenant.objects.get(
                        Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    )
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by query param: {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.warning(f"Tenant not found for query param: {tenant_slug}")
                    # Continue to other methods if query param failed

            # 3. Try to match by platform subdomain (e.g. slug.onrender.com)
            parts = host.split('.')
            platform_domains = ['localhost', 'onrender.com', 'vercel.app', 'railway.app']
            is_platform = any(d in host for d in platform_domains)
            
            platform_slug = None
            if is_platform and len(parts) >= 2:
                potentially_slug = parts[0]
                if potentially_slug not in ['www', 'api', 'admin', 'localhost']:
                    platform_slug = potentially_slug
            
            if platform_slug:
                try:
                    tenant = Tenant.objects.get(
                        slug=platform_slug,
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    )
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by platform subdomain: {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.info(f"No tenant found for platform subdomain: {platform_slug}")
                    # Continue to SaaS fallback

            # 4. SaaS Fallback: Check if the clean host is exactly a slug
            # This handles cases like doctorinox.cl where doctorinox.cl IS the slug
            if not is_platform:
                try:
                    tenant = Tenant.objects.get(
                        slug=clean_host,
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    )
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by SaaS fallback (host as slug): {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.info(f"No tenant found for SaaS fallback host: {clean_host}")
            
            # If we reach here, we didn't find a tenant
            # Certain storefront paths are global (like communes) and don't REQUIRE a tenant
            global_storefront_paths = [
                '/api/storefront/communes/',
            ]
            
            is_global_storefront = any(request.path.startswith(p) for p in global_storefront_paths)
            
            # Return 404 for storefront API requests that REQUIRE a tenant
            if request.path.startswith('/api/storefront/') and not is_global_storefront:
                logger.warning(f"Tenant not found for storefront request. Host: {host}, Query: {tenant_slug}")
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
            raise e
