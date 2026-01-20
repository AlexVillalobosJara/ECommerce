from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .admin_user_views import IsTenantAdmin
from products.models import Product, ProductFeature
from .admin_product_serializers import ProductFeatureAdminSerializer

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_feature_create(request, product_id):
    """Create a new feature for a product"""
    tenant = request.tenant
    
    try:
        product = Product.objects.get(
            id=product_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ProductFeatureAdminSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            tenant=tenant,
            product=product
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_feature_detail(request, product_id, feature_id):
    """
    PUT: Update feature
    DELETE: Delete feature
    """
    tenant = request.tenant
    
    try:
        feature = ProductFeature.objects.get(
            id=feature_id,
            product_id=product_id,
            tenant=tenant
        )
    except ProductFeature.DoesNotExist:
        return Response(
            {'error': 'Feature not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = ProductFeatureAdminSerializer(
            feature,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        feature.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
