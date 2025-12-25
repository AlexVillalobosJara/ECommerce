from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StorefrontCategoryViewSet, StorefrontProductViewSet, ProductReviewViewSet

router = DefaultRouter()
router.register(r'categories', StorefrontCategoryViewSet, basename='storefront-category')
router.register(r'products', StorefrontProductViewSet, basename='storefront-product')

urlpatterns = [
    path('', include(router.urls)),
    path('products/<slug:product_slug>/reviews/', ProductReviewViewSet.as_view({'get': 'list', 'post': 'create'}), name='product-reviews'),
]
