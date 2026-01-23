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
            # Health check is ultra-lightweight and ignores database
            if request.path == '/api/health/' or request.path.startswith('/admin/'):
                if not hasattr(request, 'tenant'):
                    request.tenant = None
                return None

            # Get the host from the request
            host = request.get_host().split(':')[0].lower()
            
            # 1. Try Cache First (Redis)
            # This avoids ANY database query for known tenants/hosts
            cache_key = f"resolved_tenant_{host}"
            cached_tenant = cache.get(cache_key)
            
            if cached_tenant == "NOT_FOUND":
                request.tenant = None
                return None
            elif cached_tenant:
                request.tenant = cached_tenant
                return None

            # 2. Resolution Logic (Database Fallback)
            tenant = None
            
            # Optimization: ONLY defer sensitive fields that should NEVER be sent to frontend.
            # This protects secrets AND avoids "deferred field" DB hits for UI text fields.
            sensitive_fields = [
                'transbank_api_key', 'transbank_commerce_code',
                'mercadopago_access_token', 'mercadopago_public_key',
                'khipu_receiver_id', 'khipu_secret_key',
                'smtp_username', 'smtp_password', 'smtp_host'
            ]
            
            # --- Resolution 0: X-Tenant header (API Priority) ---
            header_tenant_slug = request.headers.get('X-Tenant')
            if header_tenant_slug:
                tenant = Tenant.objects.filter(
                    Q(slug=header_tenant_slug) | Q(custom_domain=header_tenant_slug),
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).defer(*sensitive_fields).first()
            
            # --- Resolution 1: Custom Domain ---
            if not tenant:
                clean_host = host[4:] if host.startswith('www.') else host
                tenant = Tenant.objects.filter(
                    Q(custom_domain=host) | Q(custom_domain=clean_host),
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).defer(*sensitive_fields).first()

            # --- Resolution 2: Query Params ---
            if not tenant:
                tenant_slug = request.GET.get('tenant') or request.GET.get('slug')
                if tenant_slug:
                    tenant = Tenant.objects.filter(
                        Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
                        status__in=['Active', 'Trial'],
                        deleted_at__isnull=True
                    ).defer(*sensitive_fields).first()

            # --- Resolution 3: Platform Subdomain (slug.onrender.com, etc) ---
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

            # --- Resolution 4: SaaS Fallback (host is the slug) ---
            if not tenant and not is_platform:
                clean_host = host[4:] if host.startswith('www.') else host
                tenant = Tenant.objects.filter(
                    slug=clean_host,
                    status__in=['Active', 'Trial'],
                    deleted_at__isnull=True
                ).defer(*sensitive_fields).first()

            # 3. Handle Result & Cache
            if tenant:
                request.tenant = tenant
                # Cache full object for 1 hora (was 10 mins).
                # These objects change infrequently, so long cache is better for Egress.
                cache.set(cache_key, tenant, timeout=3600)
                return None
            
            # Negative Caching: Prevent frequent DB hits for non-existent hosts (bots/noise)
            cache.set(cache_key, "NOT_FOUND", timeout=60)
            
            # Fallback for storefront API
            global_storefront_paths = ['/api/storefront/communes/', '/api/storefront/home-data/']
            is_global_storefront = any(request.path.startswith(p) for p in global_storefront_paths)
            
            if request.path.startswith('/api/storefront/') and not is_global_storefront:
                return JsonResponse({
                    'error': 'Tenant not found',
                    'detail': f'No active tenant found for host: {host}'
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
