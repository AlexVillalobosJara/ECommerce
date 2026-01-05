"""
Supabase Storage client for Django backend
"""
from supabase import create_client, Client
from django.conf import settings


def get_supabase_client() -> Client:
    """
    Get configured Supabase client for storage operations
    
    Returns:
        Client: Configured Supabase client
    
    Raises:
        ValueError: If Supabase credentials are not configured
    """
    supabase_url = getattr(settings, 'SUPABASE_URL', None)
    supabase_key = getattr(settings, 'SUPABASE_SERVICE_KEY', None)
    
    if not supabase_url or not supabase_key:
        raise ValueError(
            "Supabase credentials not configured. "
            "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in settings."
        )
    
    return create_client(supabase_url, supabase_key)


def get_storage_bucket():
    """Get the configured storage bucket name"""
    return getattr(settings, 'SUPABASE_BUCKET', 'ecommerce-imagenes')
