
import os
import uuid
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from .admin_user_views import IsTenantAdmin

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
@parser_classes([MultiPartParser, FormParser])
def upload_media(request):
    """
    Generic media upload endpoint for local development
    Saves files to MEDIA_ROOT/{tenant_id}/{folder}/{filename}
    """
    tenant = request.tenant
    
    # Get uploaded file
    file_obj = request.FILES.get('file')
    if not file_obj:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get folder (default to 'uploads')
    folder = request.data.get('folder', 'uploads')
    # Sanitize folder name to prevent directory traversal
    folder = "".join([c for c in folder if c.isalnum() or c in ('-', '_')])
    
    # Generate unique filename
    ext = os.path.splitext(file_obj.name)[1]
    filename = f"{uuid.uuid4()}{ext}"
    
    # Create directory path
    # Structure: media/{tenant_id}/{folder}/
    upload_path = os.path.join(
        settings.MEDIA_ROOT,
        str(tenant.id),
        folder
    )
    os.makedirs(upload_path, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_path, filename)
    with open(file_path, 'wb+') as destination:
        for chunk in file_obj.chunks():
            destination.write(chunk)
    
    # Create public URL
    # Format: /media/{tenant_id}/{folder}/{filename}
    # Note: FRONTEND_URL is not prepended here because the frontend usually handles relative URLs 
    # or expects a full URL. If local, we return the relative path which works with the proxy or same-origin.
    # However, supabase returns a full URL. To map this, we can return a full URL if we know the host,
    # or just the path and let the frontend handle it.
    # Given the frontend logic creates Supabase object {url: ...}, let's return a full URL if possible,
    # or a relative one. Frontend `next/image` handles relative URLs fine.
    
    relative_url = f"/media/{tenant.id}/{folder}/{filename}"
    full_url = request.build_absolute_uri(relative_url)
    
    return Response({
        'url': full_url, # Frontend expects a usable URL
        'path': f"{tenant.id}/{folder}/{filename}",
        'size': file_obj.size,
        'filename': filename
    }, status=status.HTTP_201_CREATED)
