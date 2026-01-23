from django.http import JsonResponse, HttpResponsePermanentRedirect
from django.utils.deprecation import MiddlewareMixin
from django.db.models import Q
from django.core.cache import cache
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
            # 0. Skip tenant resolution for health checks and admin
            if request.path == '/api/health/' or request.path.startswith('/admin/'):
                if not hasattr(request, 'tenant'):
                    request.tenant = None
                return None

            # 1. Identify Tenant (Priority Header -> Query Param -> Host)
            # This logic must be consistent between Middleware and Views
            header_tenant = request.headers.get('X-Tenant')
            slug_param = request.GET.get('tenant') or request.GET.get('slug')
            domain_param = request.GET.get('domain')
            host = request.get_host().split(':')[0].lower()
            
            identifier = header_tenant or slug_param or domain_param
            
            # Use specific cache key if identifier is present, otherwise use host
            if identifier:
                cache_key = f"resolved_tenant_v2_id_{identifier}"
            else:
                cache_key = f"resolved_tenant_v2_host_{host}"

            # 2. Try Cache First (Redis)
            cached_tenant = cache.get(cache_key)
            if cached_tenant == "NOT_FOUND":
                # Only return 404 for storefront APIs, others might be global
                if request.path.startswith('/api/storefront/'):
                    return JsonResponse({'error': 'Tenant not found', 'detail': f'Negative cache hit for {identifier or host}'}, status=404)
                request.tenant = None
                return None
            elif cached_tenant:
                request.tenant = cached_tenant
                return None

            # 3. Resolution Logic (Database Fallback)
            tenant = None
            sensitive_fields = [
                'transbank_api_key', 'transbank_commerce_code',
                'mercadopago_access_token', 'mercadopago_public_key',
                'khipu_receiver_id', 'khipu_secret_key',
                'smtp_username', 'smtp_password', 'smtp_host'
            ]
            
            # Case A: Identifier provided (Header or Param)
            if identifier:
                tenant = Tenant.objects.filter(
                    Q(slug=identifier) | Q(custom_domain=identifier),
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).defer(*sensitive_fields).first()
            
            # Case B: No identifier, use Host resolution
            if not tenant and not identifier:
                # B1: Custom Domain
                clean_host = host[4:] if host.startswith('www.') else host
                tenant = Tenant.objects.filter(
                    Q(custom_domain=host) | Q(custom_domain=clean_host),
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).defer(*sensitive_fields).first()
                
                # B2: Platform Subdomain (slug.onrender.com)
                if not tenant:
                    parts = host.split('.')
                    platform_domains = ['localhost', 'onrender.com', 'vercel.app', 'railway.app']
                    is_platform = any(d in host for d in platform_domains)
                    if is_platform and len(parts) >= 2:
                        platform_slug = parts[0]
                        if platform_slug not in ['www', 'api', 'admin', 'localhost']:
                            tenant = Tenant.objects.filter(
                                slug=platform_slug,
                                status__in=['Active', 'Trial'],
                                deleted_at__isnull=True
                            ).defer(*sensitive_fields).first()
                
                # B3: SaaS Fallback (host is slug)
                if not tenant and not is_platform:
                    tenant = Tenant.objects.filter(
                        slug=clean_host,
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    ).defer(*sensitive_fields).first()

            # 4. Handle Result & Cache
            if tenant:
                request.tenant = tenant
                # Cache for 1 hour
                cache.set(cache_key, tenant, timeout=3600)
                return None
            
            # Negative Caching
            cache.set(cache_key, "NOT_FOUND", timeout=60)
            
            # Fallback for storefront API (allow specific global endpoints)
            global_storefront_paths = ['/api/storefront/communes/', '/api/storefront/home-data/']
            is_global_storefront = any(request.path.startswith(p) for p in global_storefront_paths)
            
            if request.path.startswith('/api/storefront/') and not is_global_storefront:
                return JsonResponse({
                    'error': 'Tenant not found',
                    'detail': f'No active tenant found for identifier: {identifier or host}'
                }, status=404)
            
            request.tenant = None
            return None


        except Exception as e:
            logger.error(f"CRITICAL Error in TenantMiddleware: {str(e)}")
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
        if request.path.startswith('/admin/') or request.path == '/api/health/':
            return None
            
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return None
            
        try:
            path = request.path
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
                return HttpResponsePermanentRedirect(redirect.new_path)
        except Exception:
            pass
            
        return None


class DisableCSRFForAdminAPIMiddleware(MiddlewareMixin):
    """
    Middleware to disable CSRF for admin API routes using JWT.
    """
    def process_request(self, request):
        if request.path.startswith('/api/admin/'):
            setattr(request, '_dont_enforce_csrf_checks', True)
        return None
