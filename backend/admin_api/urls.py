from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import admin_login, admin_logout, admin_me, tenant_settings, dashboard_stats
from .admin_product_views import (
    product_list_create,
    product_detail,
    product_publish,
    product_archive,
    category_list_create,
    category_detail,
    category_reorder,
    variant_create,
    variant_detail,
    image_upload,
    image_detail,
    image_set_primary,
    generate_ai_content,
    test_csrf_bypass,
)
from .admin_cache_views import (
    cache_diagnostics,
    clear_tenant_cache,
)
from .admin_order_views import (
    order_list,
    order_detail,
    order_update_status,
    order_cancel,
    order_stats,
    respond_quote,
)
from .admin_payment_views import (
    list_payment_gateways,
    configure_payment_gateway,
    test_payment_gateway,
    delete_payment_gateway,
    initiate_transbank_certification,
    confirm_transbank_certification,
)
from .admin_shipping_views import (
    AdminShippingZoneViewSet,
    AdminShippingCarrierConfigViewSet,
    CommuneViewSet,
)
from .admin_customer_views import CustomerViewSet
from .admin_coupon_views import DiscountCouponViewSet
from .admin_user_views import AdminUserViewSet
from .admin_marketing_views import TenantMarketingConfigViewSet
from .admin_seo_views import AdminRedirectViewSet
from .admin_dashboard_views import AdminDashboardViewSet
from .admin_tenant_views import AdminTenantViewSet

app_name = 'admin_api'

urlpatterns = [
    # Authentication
    path('auth/login/', admin_login, name='admin_login'),
    path('auth/logout/', admin_logout, name='admin_logout'),
    path('auth/me/', admin_me, name='admin_me'),
    
    # Tenant Settings
    path('settings/tenant/', tenant_settings, name='tenant_settings'),
    path('settings/cache/diagnostics/', cache_diagnostics, name='cache_diagnostics'),
    path('settings/cache/clear/', clear_tenant_cache, name='clear_tenant_cache'),
    path('dashboard/stats/', AdminDashboardViewSet.as_view({'get': 'stats'}), name='dashboard_stats'),
    
    # Products
    path('products/', product_list_create, name='product_list_create'),
    path('products/<uuid:product_id>/', product_detail, name='product_detail'),
    path('products/<uuid:product_id>/publish/', product_publish, name='product_publish'),
    path('products/<uuid:product_id>/archive/', product_archive, name='product_archive'),
    path('products/test-csrf/', test_csrf_bypass, name='test_csrf_bypass'),
    path('products/generate-ai-content/', csrf_exempt(generate_ai_content), name='generate_ai_content'),
    
    # Categories
    path('categories/', category_list_create, name='category_list_create'),
    path('categories/reorder/', category_reorder, name='category_reorder'),
    path('categories/<uuid:category_id>/', category_detail, name='category_detail'),
    
    # Variants
    path('products/<uuid:product_id>/variants/', variant_create, name='variant_create'),
    path('products/<uuid:product_id>/variants/<uuid:variant_id>/', variant_detail, name='variant_detail'),
    
    # Images
    path('products/<uuid:product_id>/images/upload/', image_upload, name='image_upload'),
    path('products/<uuid:product_id>/images/<uuid:image_id>/', image_detail, name='image_detail'),
    path('products/<uuid:product_id>/images/<uuid:image_id>/set-primary/', image_set_primary, name='image_set_primary'),
    
    # Orders
    path('orders/', order_list, name='order_list'),
    path('orders/stats/', order_stats, name='order_stats'),
    path('orders/<uuid:pk>/', order_detail, name='order_detail'),
    path('orders/<uuid:pk>/status/', order_update_status, name='order_update_status'),
    path('orders/<uuid:pk>/cancel/', order_cancel, name='order_cancel'),
    path('orders/<uuid:pk>/respond_quote/', respond_quote, name='respond_quote'),
    
    # Payment Gateway Configuration
    path('payment-gateways/', list_payment_gateways, name='list_payment_gateways'),
    path('payment-gateways/<str:gateway>/', configure_payment_gateway, name='configure_payment_gateway'),
    path('payment-gateways/<str:gateway>/test/', test_payment_gateway, name='test_payment_gateway'),
    path('payment-gateways/transbank/certify/', initiate_transbank_certification, name='initiate_transbank_certification'),
    path('payment-gateways/transbank/confirm/', confirm_transbank_certification, name='confirm_transbank_certification'),
    path('payment-gateways/<str:gateway>/delete/', delete_payment_gateway, name='delete_payment_gateway'),
    
    # Shipping Zones
    path('shipping-zones/', AdminShippingZoneViewSet.as_view({'get': 'list', 'post': 'create'}), name='shipping_zone_list'),
    path('shipping-zones/<uuid:pk>/', AdminShippingZoneViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='shipping_zone_detail'),
    
    # Shipping Carriers
    path('shipping-carriers/', AdminShippingCarrierConfigViewSet.as_view({'get': 'list', 'post': 'create'}), name='shipping_carrier_list'),
    path('shipping-carriers/<uuid:pk>/', AdminShippingCarrierConfigViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='shipping_carrier_detail'),

    
    # Communes
    path('communes/', CommuneViewSet.as_view({'get': 'list'}), name='commune_list'),
    path('communes/by-region/', CommuneViewSet.as_view({'get': 'by_region'}), name='commune_by_region'),
    path('communes/search/', CommuneViewSet.as_view({'get': 'search'}), name='commune_search'),
    path('communes/<uuid:pk>/', CommuneViewSet.as_view({'get': 'retrieve'}), name='commune_detail'),
    
    # Customers
    path('customers/', CustomerViewSet.as_view({'get': 'list', 'post': 'create'}), name='customer_list'),
    path('customers/<uuid:pk>/', CustomerViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='customer_detail'),
    
    # Coupons
    path('coupons/', DiscountCouponViewSet.as_view({'get': 'list', 'post': 'create'}), name='coupon_list'),
    path('coupons/<uuid:pk>/', DiscountCouponViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='coupon_detail'),
    
    # Users
    path('users/', AdminUserViewSet.as_view({'get': 'list', 'post': 'create'}), name='user_list'),
    path('users/<uuid:pk>/', AdminUserViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='user_detail'),
    
    # Marketing Configuration
    path('marketing-config/', TenantMarketingConfigViewSet.as_view({'get': 'list', 'put': 'update', 'patch': 'partial_update'}), name='marketing_config'),
    
    # SEO & Redirects
    path('redirects/', AdminRedirectViewSet.as_view({'get': 'list', 'post': 'create'}), name='redirect_list'),
    path('redirects/<uuid:pk>/', AdminRedirectViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='redirect_detail'),
    
    # Superadmin Tenant Management
    path('tenants/', AdminTenantViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin_tenant_list'),
    path('tenants/<uuid:pk>/', AdminTenantViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin_tenant_detail'),
]
