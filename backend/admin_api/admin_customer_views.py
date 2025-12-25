from rest_framework import viewsets, filters 
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.db.models import Count, Sum, Q, Value
from django.db.models.functions import Coalesce
from orders.models import Customer
from .admin_customer_serializers import CustomerSerializer
from .jwt_authentication import TenantJWTAuthentication

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    authentication_classes = [TenantJWTAuthentication]
    permission_classes = [] # Handled by authentication

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Customer.objects.none()
        
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return Customer.objects.none()
            
        queryset = Customer.objects.filter(tenant=tenant)
        
        # Annotate with stats
        queryset = queryset.annotate(
            total_orders=Count('orders'),
            total_spent=Coalesce(Sum('orders__total'), Value(0), output_field=models.DecimalField())
        ).order_by('-created_at')
        
        return queryset

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        # also set created_by
        serializer.save(
            tenant=tenant,
            # created_by=self.request.user.id  # Assuming user.id is UUID
        )

    def filter_queryset(self, queryset):
        # Manual filtering or basic filtering
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) | 
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(tax_id__icontains=search)
            )
            
        customer_type = self.request.query_params.get('customer_type', None)
        if customer_type and customer_type != 'all':
            queryset = queryset.filter(customer_type=customer_type)

        return queryset
