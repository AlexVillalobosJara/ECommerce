from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def test_orders_endpoint(request):
    """
    Simple test endpoint to verify authentication and tenant
    """
    return Response({
        'message': 'Test successful',
        'has_tenant': hasattr(request, 'tenant'),
        'tenant_id': str(request.tenant.id) if hasattr(request, 'tenant') and request.tenant else None,
        'user': str(request.user),
        'is_admin': request.user.is_staff if hasattr(request, 'user') else False
    })
