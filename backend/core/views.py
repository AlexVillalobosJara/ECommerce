from django.http import JsonResponse

def health_check(request):
    """
    Ultra-lightweight health check endpoint.
    Exempt from TenantMiddleware to avoid DB hits from monitoring tools.
    """
    return JsonResponse({
        "status": "healthy",
        "service": "ecommerce-backend"
    })
