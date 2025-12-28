import os
import uuid
from datetime import datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .admin_user_views import IsTenantAdmin
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.conf import settings

from products.models import Product, Category, ProductVariant, ProductImage
from .admin_product_serializers import (
    ProductListAdminSerializer,
    ProductDetailAdminSerializer,
    CategoryListSerializer,
    CategoryDetailSerializer,
    ProductVariantAdminSerializer,
    ProductImageAdminSerializer
)


# ============================================================================
# PRODUCT ENDPOINTS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_list_create(request):
    """
    GET: List all products with filtering
    POST: Create a new product
    """
    tenant = request.tenant
    
    if request.method == 'GET':
        # Get query parameters
        search = request.GET.get('search', '')
        status_filter = request.GET.get('status', '')
        category_id = request.GET.get('category', '')
        is_featured = request.GET.get('is_featured', '')
        
        # Base queryset
        products = Product.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True
        ).select_related('category').prefetch_related('variants', 'images')
        
        # Apply filters
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(description__icontains=search)
            )
        
        if status_filter:
            products = products.filter(status=status_filter)
        
        if category_id:
            products = products.filter(category_id=category_id)
        
        if is_featured:
            products = products.filter(is_featured=is_featured.lower() == 'true')
        
        # Order by creation date (newest first)
        products = products.order_by('-created_at')
        
        serializer = ProductListAdminSerializer(products, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ProductDetailAdminSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_detail(request, product_id):
    """
    GET: Get product details
    PUT: Update product
    DELETE: Soft delete product
    """
    tenant = request.tenant
    
    try:
        product = Product.objects.select_related('category').prefetch_related(
            'variants', 'images'
        ).get(
            id=product_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ProductDetailAdminSerializer(product)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProductDetailAdminSerializer(
            product,
            data=request.data,
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Soft delete
        product.deleted_at = timezone.now()
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_publish(request, product_id):
    """Publish a product"""
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
    
    product.status = 'Published'
    product.published_at = timezone.now()
    product.save()
    
    serializer = ProductDetailAdminSerializer(product)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def product_archive(request, product_id):
    """Archive a product"""
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
    
    product.status = 'Archived'
    product.save()
    
    serializer = ProductDetailAdminSerializer(product)
    return Response(serializer.data)


# ============================================================================
# CATEGORY ENDPOINTS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def category_list_create(request):
    """
    GET: List all categories
    POST: Create a new category
    """
    tenant = request.tenant
    
    if request.method == 'GET':
        categories = Category.objects.filter(
            tenant=tenant,
            deleted_at__isnull=True
        ).order_by('sort_order', 'name')
        
        serializer = CategoryListSerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CategoryDetailSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def category_detail(request, category_id):
    """
    GET: Get category details
    PUT: Update category
    DELETE: Delete category
    """
    tenant = request.tenant
    
    try:
        category = Category.objects.get(
            id=category_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = CategoryDetailSerializer(category)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CategoryDetailSerializer(
            category,
            data=request.data,
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Check if category has products
        if category.products.filter(deleted_at__isnull=True).exists():
            return Response(
                {'error': 'Cannot delete category with products. Please reassign or delete products first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if category has subcategories
        if category.children.filter(deleted_at__isnull=True).exists():
            return Response(
                {'error': 'Cannot delete category with subcategories. Please delete or reassign subcategories first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete
        from django.utils import timezone
        category.deleted_at = timezone.now()
        category.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def category_reorder(request):
    """
    POST: Reorder categories
    Body: [{"id": "uuid", "sort_order": 0}, ...]
    """
    tenant = request.tenant
    items = request.data
    
    if not isinstance(items, list):
        return Response(
            {'error': 'Expected a list of items'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        for item in items:
            category = Category.objects.get(
                id=item['id'],
                tenant=tenant,
                deleted_at__isnull=True
            )
            category.sort_order = item['sort_order']
            category.updated_by = request.user.id
            category.save()
        
        return Response({'message': 'Categories reordered successfully'})
    except Category.DoesNotExist:
        return Response(
            {'error': 'Category not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except KeyError as e:
        return Response(
            {'error': f'Missing required field: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


# ============================================================================
# VARIANT ENDPOINTS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def variant_create(request, product_id):
    """Create a new variant for a product"""
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
    
    serializer = ProductVariantAdminSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(
            tenant=tenant,
            product=product,
            created_by=request.user.id
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def variant_detail(request, product_id, variant_id):
    """
    PUT: Update variant
    DELETE: Delete variant
    """
    tenant = request.tenant
    
    try:
        variant = ProductVariant.objects.get(
            id=variant_id,
            product_id=product_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except ProductVariant.DoesNotExist:
        return Response(
            {'error': 'Variant not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = ProductVariantAdminSerializer(
            variant,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(updated_by=request.user.id)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        variant.deleted_at = timezone.now()
        variant.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================================
# IMAGE UPLOAD ENDPOINTS
# ============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
@parser_classes([MultiPartParser, FormParser])
def image_upload(request, product_id):
    """Upload an image for a product"""
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
    
    # Get uploaded file
    image_file = request.FILES.get('image')
    if not image_file:
        return Response(
            {'error': 'No image file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if image_file.content_type not in allowed_types:
        return Response(
            {'error': 'Invalid file type. Allowed: JPEG, PNG, WebP'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file size (5MB max)
    max_size = 5 * 1024 * 1024  # 5MB
    if image_file.size > max_size:
        return Response(
            {'error': 'File size exceeds 5MB limit'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate unique filename
    ext = os.path.splitext(image_file.name)[1]
    filename = f"{uuid.uuid4()}{ext}"
    
    # Create directory path
    upload_path = os.path.join(
        settings.MEDIA_ROOT,
        'products',
        str(tenant.id),
        str(product.id)
    )
    os.makedirs(upload_path, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_path, filename)
    with open(file_path, 'wb+') as destination:
        for chunk in image_file.chunks():
            destination.write(chunk)
    
    # Create relative URL
    relative_url = f"/media/products/{tenant.id}/{product.id}/{filename}"
    
    # Get metadata from request
    alt_text = request.data.get('alt_text', '')
    sort_order = request.data.get('sort_order', 0)
    is_primary = request.data.get('is_primary', 'false').lower() == 'true'
    
    # If this is set as primary, unset other primary images
    if is_primary:
        ProductImage.objects.filter(
            product=product,
            deleted_at__isnull=True
        ).update(is_primary=False)
    
    # Create ProductImage record
    product_image = ProductImage.objects.create(
        tenant=tenant,
        product=product,
        url=relative_url,
        alt_text=alt_text,
        sort_order=sort_order,
        is_primary=is_primary
    )
    
    serializer = ProductImageAdminSerializer(product_image)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def image_detail(request, product_id, image_id):
    """
    PUT: Update image metadata
    DELETE: Delete image
    """
    tenant = request.tenant
    
    try:
        image = ProductImage.objects.get(
            id=image_id,
            product_id=product_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except ProductImage.DoesNotExist:
        return Response(
            {'error': 'Image not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = ProductImageAdminSerializer(
            image,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Delete physical file
        if image.url:
            file_path = os.path.join(settings.MEDIA_ROOT, image.url.lstrip('/media/'))
            if os.path.exists(file_path):
                os.remove(file_path)
        
        # Soft delete database record
        image.deleted_at = timezone.now()
        image.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def image_set_primary(request, product_id, image_id):
    """Set an image as primary"""
    tenant = request.tenant
    
    try:
        image = ProductImage.objects.get(
            id=image_id,
            product_id=product_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except ProductImage.DoesNotExist:
        return Response(
            {'error': 'Image not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Unset other primary images
    ProductImage.objects.filter(
        product_id=product_id,
        tenant=tenant,
        deleted_at__isnull=True
    ).update(is_primary=False)
    
    # Set this image as primary
    image.is_primary = True
    image.save()
    
    serializer = ProductImageAdminSerializer(image)
    return Response(serializer.data)
