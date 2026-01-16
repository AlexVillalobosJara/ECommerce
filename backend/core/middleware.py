from django.http import JsonResponse, HttpResponsePermanentRedirect
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Q
from tenants.models import Tenant, Redirect
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
            tenant_slug = request.GET.get('tenant') or request.GET.get('slug')
            tenant_domain = request.GET.get('domain')
            
            if tenant_slug or tenant_domain:
                try:
                    if tenant_slug:
                        tenant = Tenant.objects.get(
                            Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
                            status__in=['Active', 'Trial'],
                            deleted_at__isnull=True
                        )
                    else:
                        tenant = Tenant.objects.get(
                            custom_domain=tenant_domain,
                            status__in=['Active', 'Trial'],
                            deleted_at__isnull=True
                        )
                    request.tenant = tenant
                    logger.info(f"Tenant resolved by query param: {tenant.slug}")
                    return None
                except Tenant.DoesNotExist:
                    logger.warning(f"Tenant not found for query params: {tenant_slug or tenant_domain}")
                    # DO NOT RETURN NONE HERE - let the middleware try other resolution methods
            
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

            # 4. SaaS Fallback: Check if the clean host is exactly a slug
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
            global_storefront_paths = [
                '/api/storefront/communes/',
                '/api/storefront/home-data/',
            ]
            
            is_global_storefront = any(request.path.startswith(p) for p in global_storefront_paths)
            
            if request.path.startswith('/api/storefront/') and not is_global_storefront:
                logger.warning(f"Tenant not found for storefront request. Host: {host}")
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


class RedirectMiddleware(MiddlewareMixin):
    """
    Middleware to handle 301 redirects for tenants.
    Must run AFTER TenantMiddleware.
    """
    def process_request(self, request):
        # 1. Skip admin routes
        if request.path.startswith('/admin/'):
            return None
            
        # 2. Get tenant
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return None
            
        # 3. Check for exact match in redirect table
        try:
            path = request.path
            # Normalize: check with and without trailing slash to be more robust
            paths_to_check = [path]
            if path.endswith('/') and len(path) > 1:
                paths_to_check.append(path[:-1])
            elif not path.endswith('/'):
                paths_to_check.append(path + '/')
                
            redirect = Redirect.objects.filter(
                tenant=tenant, 
                old_path__in=paths_to_check, 
                is_active=True
            ).first()
            
            if redirect:
                logger.info(f"Redirect found: {redirect.old_path} -> {redirect.new_path}")
                return HttpResponsePermanentRedirect(redirect.new_path)
                
        except Exception as e:
            logger.error(f"Error in RedirectMiddleware: {str(e)}")
            
        return None


class DisableCSRFForAdminAPIMiddleware(MiddlewareMixin):
    """
    Middleware to disable CSRF for admin API routes that use JWT authentication.
    JWT tokens in Authorization headers are not vulnerable to CSRF attacks.
    
    Must be placed BEFORE CsrfViewMiddleware in MIDDLEWARE settings.
    """
    def process_request(self, request):
        path = request.path
        logger.info(f"DisableCSRFForAdminAPIMiddleware - Path: {path}")
        
        # Exempt all /api/admin/ routes from CSRF
        if path.startswith('/api/admin/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
            logger.warning(f"CSRF DISABLED for admin API route: {path}")
            return None
        
        logger.info(f"CSRF NOT disabled for path: {path}")
        return None
