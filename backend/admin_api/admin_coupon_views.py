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
        tenant = getattr(self.request, 'tenant', None)
        serializer.save(
            tenant=tenant,
            created_by=self.request.user.id
        )

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
