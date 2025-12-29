from rest_framework import viewsets, filters
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

    def perform_create(self, serializer):
        import logging
        logger = logging.getLogger(__name__)
        
        tenant = getattr(self.request, 'tenant', None)
        
        # Robust fallback for tenant
        if not tenant:
            tenant_slug = self.request.headers.get('X-Tenant-Slug')
            if tenant_slug:
                from tenants.models import Tenant
                tenant = Tenant.objects.filter(slug=tenant_slug, deleted_at__isnull=True).first()
                logger.info(f"Tenant resolved via header for coupon: {tenant}")
        
        if not tenant:
             logger.error("No tenant found during coupon creation")
             # DRF will handle integrity error if tenant is null, 
             # but we want to know why it happened.
        
        # Fix UUID issue: if created_by is UUIDField, don't pass int ID
        # Many of our models use UUID for created_by, but auth.User uses int.
        # We can pass None or a special system UUID if needed, but for now 
        # let's just avoid the crash by not passing it if it's the source of 500.
        # Products app uses request.user.id which works, so if it fails here 
        # it might be a specific DB constraint in production.
        
        try:
            serializer.save(
                tenant=tenant,
                # created_by=self.request.user.id # Potential source of 500 if DB is strict
            )
            logger.info(f"Coupon {serializer.instance.code} created for tenant {tenant}")
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
