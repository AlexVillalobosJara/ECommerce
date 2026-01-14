from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShippingZoneViewSet, OrderViewSet, StorefrontCommuneViewSet, ValidateCouponView, ShippingCarrierConfigViewSet
from .payment_views import initiate_payment, payment_callback, payment_return_handler, payment_status_check, payment_status_by_token, verify_payment_manually, get_active_payment_gateways

router = DefaultRouter()
router.register(r'shipping-zones', ShippingZoneViewSet, basename='shipping-zone')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'communes', StorefrontCommuneViewSet, basename='storefront-commune')
router.register(r'shipping-carriers', ShippingCarrierConfigViewSet, basename='shipping-carrier')

urlpatterns = [
    path('', include(router.urls)),
    
    # Payment endpoints
    path('payments/initiate/', initiate_payment, name='initiate_payment'),
    path('payments/callback/<str:gateway>/', payment_callback, name='payment_callback'),
    path('payments/return/<str:gateway>/', payment_return_handler, name='payment_return_handler'),
    path('payments/status/<uuid:order_id>/', payment_status_check, name='payment_status'),
    path('payments/token/<str:token>/', payment_status_by_token, name='payment_status_by_token'),
    path('payments/verify/<uuid:order_id>/', verify_payment_manually, name='verify_payment_manually'),
    
    # Storefront endpoints
    path('cart/validate-coupon/', ValidateCouponView.as_view(), name='validate_coupon'),
    path('payment-gateways/active/', get_active_payment_gateways, name='active_payment_gateways'),
]
