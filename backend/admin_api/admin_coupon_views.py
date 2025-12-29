from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from orders.models import DiscountCoupon
from .admin_coupon_serializers import DiscountCouponSerializer
from .jwt_authentication import TenantJWTAuthentication

class DiscountCouponViewSet(viewsets.ModelViewSet):
    serializer_class = DiscountCouponSerializer
    authentication_classes = [TenantJWTAuthentication]
    permission_classes = []

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return DiscountCoupon.objects.none()
        
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return DiscountCoupon.objects.none()
            
        return DiscountCoupon.objects.filter(tenant=tenant).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        """Override create to catch any crash and return detail"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            error_detail = traceback.format_exc()
            logger.error(f"DEBUG_COUPON_CREATE_ERROR: {error_detail}")
            return Response({
                "error": "Error interno del servidor",
                "detail": str(e),
                "traceback": error_detail # Temporarily exposed to ALL for debugging
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        tenant = getattr(self.request, 'tenant', None)
        
        # 1. Fallback: Resolve via Header
        if not tenant:
            tenant_slug = self.request.headers.get('X-Tenant-Slug')
            if tenant_slug:
                from tenants.models import Tenant
                tenant = Tenant.objects.filter(slug=tenant_slug, deleted_at__isnull=True).first()
                if tenant:
                    logger.info(f"Tenant resolved via header for coupon: {tenant.slug}")

        # 2. Fallback: Resolve via TenantUser relationship
        if not tenant and self.request.user.is_authenticated:
            from tenants.models import TenantUser
            tenant_user = TenantUser.objects.filter(
                user=self.request.user, 
                is_active=True,
                tenant__status='Active',
                tenant__deleted_at__isnull=True
            ).select_related('tenant').first()
            if tenant_user:
                tenant = tenant_user.tenant
                logger.info(f"Tenant resolved via TenantUser for coupon: {tenant.slug}")

        # 3. Fallback: For superusers, take the first active tenant
        if not tenant and self.request.user.is_superuser:
            from tenants.models import Tenant
            tenant = Tenant.objects.filter(status='Active', deleted_at__isnull=True).first()
            if tenant:
                logger.info(f"Tenant resolved as superuser fallback for coupon: {tenant.slug}")

        if not tenant:
            logger.error(f"Failed to resolve tenant for coupon creation. User: {self.request.user}")
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"error": "No se pudo determinar el comercio (tenant). Por favor, intenta cerrar sesión y volver a entrar."})
        
        try:
            # Explicitly force tenant and audit
            # Note: request.user.id is usually an integer, but created_by is a UUIDField.
            # We skip setting it here if it might cause a type crash in production.
            serializer.save(tenant=tenant)
            logger.info(f"Coupon {serializer.instance.code} created for tenant {tenant.slug}")
        except Exception as e:
            logger.exception(f"Error saving coupon: {str(e)}")
            raise

    def filter_queryset(self, queryset):
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(code__icontains=search)
            
        status = self.request.query_params.get('status', None)
        if status == 'active':
            queryset = queryset.filter(is_active=True)
        elif status == 'inactive':
            queryset = queryset.filter(is_active=False)

        return queryset
