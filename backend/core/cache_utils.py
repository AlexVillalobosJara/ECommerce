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
    Invalidate all product-related cache for a tenant by bumping the version.
    Replaces slow delete_pattern.
    """
    # Bump version for 'products_list' scope for this tenant
    # This invalidates all product lists that rely on this version
    bump_cache_version('products_list', tenant_id)
    
    # Also bump 'categories' scope as products affect category lists
    bump_cache_version('categories', tenant_id)


def invalidate_category_cache(tenant_id):
    """
    Invalidate category cache for a tenant.
    Also invalidates product cache since products depend on categories.
    
    Args:
        tenant_id: UUID of the tenant
    """
    try:
        cache.delete(f"categories_{tenant_id}")
    except Exception:
        pass
    invalidate_product_cache(tenant_id)


    # Invalidate old product pattern for backward compatibility if needed, 
    # but versioning makes this redundant for new requests.
    try:
        if hasattr(cache, "delete_pattern"):
            # Clean up old keys if existing to avoid memory leak only if we care
            # But mostly we depend on version bumps now.
            pass
    except Exception:
        pass


def invalidate_tenant_cache(tenant_id):
    """
    Invalidate all tenant-related cache when tenant settings change.
    """
    try:
        # Direct key invalidation for non-versioned keys
        cache.delete(f"tenant_settings_{tenant_id}")
        cache.delete(f"storefront_common_data_{tenant_id}")
        # dashboard_stats might need versioning later, but delete for now
        cache.delete(f"dashboard_stats_{tenant_id}")
        
        # Bump versions for versioned scopes
        # Tenant settings affect everything (Home, Categories, Products)
        bump_cache_version('home_data', tenant_id)
        bump_cache_version('categories', tenant_id)
        bump_cache_version('products_list', tenant_id)
        
    except Exception:
        pass


def get_cache_version(scope, scope_id):
    """
    Get the current version for a specific cache scope (e.g. 'category', 'product_list').
    Returns an integer version number (defaults to 1).
    """
    version_key = f"version_{scope}_{scope_id}"
    version = cache.get(version_key)
    if version is None:
        version = 1
        cache.set(version_key, version, timeout=None) # Optimize: No timeout, or long timeout
    return version


def bump_cache_version(scope, scope_id):
    """
    Increment the version for a specific cache scope.
    This effectively invalidates all keys depending on this version.
    """
    version_key = f"version_{scope}_{scope_id}"
    try:
        # Atomic increment in Redis
        if hasattr(cache, 'incr'):
            cache.incr(version_key)
        else:
            # Fallback for LocMemCache
            version = cache.get(version_key, 1)
            cache.set(version_key, version + 1, timeout=None)
    except Exception:
        pass


def get_versioned_cache_key(base_key, scope, scope_id):
    """
    Generate a versioned cache key.
    Format: {base_key}:v{version}
    """
    version = get_cache_version(scope, scope_id)
    return f"{base_key}:v{version}"

