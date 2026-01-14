import time
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .admin_user_views import IsTenantAdmin
from django.core.cache import cache
from django.conf import settings

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def cache_diagnostics(request):
    """
    Returns diagnostic information about the cache system.
    """
    tenant = request.tenant
    
    # 1. Determine Cache Backend
    # django-redis uses ConnectionProxy, LocMem uses its own class
    backend_class = cache.__class__.__name__
    
    # 2. Check for Redis URL in settings (masked)
    redis_url = getattr(settings, 'REDIS_URL', None)
    has_redis_config = redis_url is not None
    
    # 3. Test Connection and Latency
    start_time = time.time()
    latency = -1
    connection_working = False
    details = ""
    
    test_key = f"diag_test_{tenant.id}"
    try:
        cache.set(test_key, "working", 10)
        value = cache.get(test_key)
        if value == "working":
            connection_working = True
            latency = (time.time() - start_time) * 1000 # ms
            cache.delete(test_key)
    except Exception as e:
        details = str(e)

    # 4. Check for delete_pattern support
    has_delete_pattern = hasattr(cache, 'delete_pattern')

    return Response({
        'backend': backend_class,
        'has_redis_config': has_redis_config,
        'connection_working': connection_working,
        'latency_ms': round(latency, 2) if latency > 0 else -1,
        'has_delete_pattern': has_delete_pattern,
        'error_details': details,
        'cache_prefix': getattr(settings, 'CACHES', {}).get('default', {}).get('KEY_PREFIX', ''),
        'is_redis': 'redis' in backend_class.lower() or 'ConnectionProxy' in backend_class
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def clear_tenant_cache(request):
    """
    Manually clear all cache for the current tenant.
    """
    tenant = request.tenant
    from core.cache_utils import invalidate_product_cache, invalidate_category_cache, invalidate_tenant_cache
    
    try:
        invalidate_product_cache(tenant.id)
        invalidate_category_cache(tenant.id)
        invalidate_tenant_cache(tenant.id)
        return Response({'message': 'Cache cleared successfully for your tenant'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
