"""
Cache utilities for handling cache operations across different backends.
"""
from django.core.cache import cache


def delete_pattern(pattern):
    """
    Delete cache keys matching a pattern.
    Works with both Redis (delete_pattern) and LocMemCache (clear all).
    
    Args:
        pattern: Pattern to match (e.g., "products_list_*")
    """
    try:
        # Try Redis delete_pattern (only available in django-redis)
        if hasattr(cache, 'delete_pattern'):
            cache.delete_pattern(pattern)
        else:
            # Fallback for LocMemCache: clear all cache
            # In development this is acceptable, in production Redis will be used
            cache.clear()
    except Exception as e:
        # If delete_pattern fails, just clear all cache as fallback
        print(f"Cache delete_pattern failed: {e}, clearing all cache")
        cache.clear()


def invalidate_product_cache(tenant_id):
    """
    Invalidate all product-related cache for a tenant.
    
    Args:
        tenant_id: UUID of the tenant
    """
    delete_pattern(f"products_list_{tenant_id}_*")


def invalidate_category_cache(tenant_id):
    """
    Invalidate category cache for a tenant.
    Also invalidates product cache since products depend on categories.
    
    Args:
        tenant_id: UUID of the tenant
    """
    cache.delete(f"categories_{tenant_id}")
    invalidate_product_cache(tenant_id)


def invalidate_tenant_cache(tenant_id):
    """
    Invalidate all tenant-related cache.
    
    Args:
        tenant_id: UUID of the tenant
    """
    cache.delete(f"tenant_settings_{tenant_id}")
    cache.delete(f"storefront_common_data_{tenant_id}")
    cache.delete(f"dashboard_stats_{tenant_id}")
