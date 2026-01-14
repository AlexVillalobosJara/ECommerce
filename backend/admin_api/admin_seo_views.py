from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from tenants.models import Redirect
from .admin_seo_serializers import RedirectSerializer
from .admin_user_views import IsTenantAdmin
import logging

logger = logging.getLogger(__name__)

class AdminRedirectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenant redirects.
    Ensures redirects are scoped to the current tenant.
    """
    serializer_class = RedirectSerializer
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    pagination_class = None

    def get_queryset(self):
        """Return redirects for current user's tenant"""
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return Redirect.objects.none()
        return Redirect.objects.filter(tenant=tenant).order_by('-created_at')

    def perform_create(self, serializer):
        """Associate redirect with current tenant"""
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "No tenant resolved for this request."})
        serializer.save(tenant=tenant)
