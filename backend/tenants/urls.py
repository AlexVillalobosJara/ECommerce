from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, PremiumPaletteViewSet, StorefrontHomeView, StorefrontCategoryView, StorefrontProductDetailView

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'premium-palettes', PremiumPaletteViewSet, basename='premium-palette')

urlpatterns = [
    path('api/storefront/home-data/', StorefrontHomeView.as_view(), name='storefront-home-data'),
    path('api/storefront/category-data/', StorefrontCategoryView.as_view(), name='storefront-category-data'),
    path('api/storefront/product-data/', StorefrontProductDetailView.as_view(), name='storefront-product-data'),
    path('api/', include(router.urls)),
]
