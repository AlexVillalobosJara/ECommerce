from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TenantViewSet, StorefrontHomeView

router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')

urlpatterns = [
    path('api/storefront/home-data/', StorefrontHomeView.as_view(), name='storefront-home-data'),
    path('api/', include(router.urls)),
]
