from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .jwt_serializers import TenantTokenObtainPairSerializer
from .admin_user_views import IsTenantAdmin


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """
    Admin login endpoint - returns JWT tokens with tenant information.
    Professional implementation for SaaS multi-tenancy.
    """
    username_or_email = request.data.get('username')
    password = request.data.get('password')
    
    # Try to find user by email if it looks like an email
    user = None
    if '@' in username_or_email:
        try:
            user_obj = User.objects.get(email=username_or_email)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass
    else:
        user = authenticate(username=username_or_email, password=password)
    
    from tenants.models import TenantUser
    is_tenant_user = TenantUser.objects.filter(user=user, is_active=True).exists() if user else False

    if user is not None and (user.is_staff or is_tenant_user):
        # Generate JWT tokens with tenant information
        serializer = TenantTokenObtainPairSerializer()
        token = serializer.get_token(user)
        
        # Determine tenant to bind (Prioritize request.tenant)
        tenant = getattr(request, 'tenant', None)
        
        # 2. If None, try to extract from Hostname (Middleware skips admin routes, so we must check manually)
        if not tenant:
            host = request.get_host().split(':')[0]
            parts = host.split('.')
            # e.g. techstore.localhost -> parts=['techstore', 'localhost']
            # e.g. demo-store.localhost -> parts=['demo-store', 'localhost']
            # e.g. localhost -> parts=['localhost']
            if len(parts) >= 2 and parts[0] not in ['www', 'api', 'admin', 'localhost', '127']:
                 slug = parts[0]
                 from tenants.models import Tenant
                 tenant = Tenant.objects.filter(slug=slug, status='Active').first()

        # 3. If still None (e.g. localhost access), try to infer from User Assignments
        if not tenant:
            from tenants.models import Tenant, TenantUser
            
            # If user has only ONE tenant, assume that one.
            user_tenants = TenantUser.objects.filter(user=user, is_active=True).select_related('tenant')
            if user_tenants.count() == 1:
                tenant = user_tenants.first().tenant
            
            # If user is Superuser and no specific tenant found, Default to 'demo-store'
            elif user.is_superuser:
                 tenant = Tenant.objects.filter(slug='demo-store', status='Active').first()
            
            # If normal user with NO tenants or MULTIPLE tenants (and no subdomain), we can't guess.
            # They must access via subdomain.


        # If we found a specific tenant, force the token to use it
        # (This overrides the random 'first()' logic in get_token)
        if tenant:
            # ENFORCE TENANT-USER ACCESS CONTROL
            # Unless user is superuser, they must have a TenantUser record
            if not user.is_superuser:
                from tenants.models import TenantUser
                has_access = TenantUser.objects.filter(user=user, tenant=tenant, is_active=True).exists()
                if not has_access:
                     return Response(
                        {'error': f'Access Denied: You are not assigned to tenant "{tenant.name}"'},
                        status=status.HTTP_403_FORBIDDEN
                    )

            token['tenant_id'] = str(tenant.id)
            token['tenant_slug'] = tenant.slug
            token['tenant_name'] = tenant.name
            
            # Get user role for this tenant
            if user.is_superuser:
                token['role'] = 'Owner' # Superusers act as Owners
            else:
                from tenants.models import TenantUser
                tu = TenantUser.objects.filter(user=user, tenant=tenant).first()
                if tu:
                    token['role'] = tu.role
                else:
                    token['role'] = 'Operator' # Fallback
        
        user_data = UserSerializer(user).data
        user_data['role'] = token.get('role', 'Operator')
        
        return Response({
            'user': user_data,
            'access': str(token.access_token),
            'refresh': str(token),
            'message': 'Login successful'
        })
    else:
        return Response(
            {'error': 'Invalid credentials or user is not admin'},
            status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def admin_logout(request):
    """Admin logout endpoint - for JWT, client just discards the token"""
    return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def admin_me(request):
    """Get current admin user information"""
    serializer = UserSerializer(request.user)
    user_data = serializer.data
    
    # Add role if tenant is present
    if hasattr(request, 'tenant') and request.tenant:
        from tenants.models import TenantUser
        tu = TenantUser.objects.filter(user=request.user, tenant=request.tenant).first()
        if tu:
            user_data['role'] = tu.role
        elif request.user.is_superuser:
            user_data['role'] = 'Owner'
    
    return Response(user_data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def tenant_settings(request):
    """
    Get or update current tenant settings.
    """
    tenant = getattr(request, 'tenant', None)
    
    if not tenant:
        # Fallback if middleware didn't set it (shouldn't happen in prod)
        # Try to find tenant associated with user or default
        return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        from tenants.serializers import TenantSerializer
        serializer = TenantSerializer(tenant)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        logger.info(f"Updating tenant settings for {tenant.slug}. Data: {request.data}")
        from tenants.serializers import TenantSerializer
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
        if serializer.is_valid():
            logger.info("Settings are valid, saving...")
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Settings validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def dashboard_stats(request):
    """
    Get dashboard statistics for the current tenant.
    """
    try:
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)

        from orders.models import Order, OrderStatus, Customer
        from products.models import Product
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncMonth
        from django.utils import timezone
        import datetime

        # 1. Total Sales (Paid/Completed orders)
        # Considering PAID, SHIPPED, DELIVERED as "Sales"
        sales_statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        
        total_sales_agg = Order.objects.filter(
            tenant=tenant, 
            status__in=sales_statuses
        ).aggregate(total=Sum('total'))
        
        total_sales = total_sales_agg['total'] or 0

        # 2. Total Orders (All non-draft, non-cancelled maybe? Or just count all?)
        # Let's count "valid" orders (not draft)
        total_orders = Order.objects.filter(
            tenant=tenant
        ).exclude(status=OrderStatus.DRAFT).count()

        # 3. Total Products
        total_products = Product.objects.filter(
            tenant=tenant,
            status='Published'
        ).count()

        # 4. Total Customers (Unique emails in orders or Customer model)
        total_customers = Customer.objects.filter(
            tenant=tenant,
            is_active=True
        ).count()

        # 5. Sales Chart Data (Last 6 months)
        six_months_ago = timezone.now() - datetime.timedelta(days=180)
        
        sales_by_month = Order.objects.filter(
            tenant=tenant,
            status__in=sales_statuses,
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('total')
        ).order_by('month')

        chart_data = []
        for entry in sales_by_month:
            chart_data.append({
                'name': entry['month'].strftime('%b'), # Jan, Feb, etc.
                'total': float(entry['total'] or 0)
            })

        # If no data, provide empty structure for UI stability
        if not chart_data:
            # Generate last 6 months empty
            for i in range(5, -1, -1):
                date = timezone.now() - datetime.timedelta(days=30*i)
                chart_data.append({
                    'name': date.strftime('%b'),
                    'total': 0
                })

        # 6. Recent Orders
        recent_orders_qs = Order.objects.filter(
            tenant=tenant
        ).exclude(status=OrderStatus.DRAFT).order_by('-created_at')[:5]

        recent_orders = []
        for order in recent_orders_qs:
            # Try to get customer name
            customer_name = "Unknown"
            customer_email = order.customer_email
            if order.customer:
                 if order.customer.first_name:
                     customer_name = f"{order.customer.first_name} {order.customer.last_name or ''}".strip()
                 elif order.customer.company_name:
                     customer_name = order.customer.company_name

            recent_orders.append({
                'id': str(order.id),
                'customer_name': customer_name,
                'customer_email': customer_email,
                'amount': float(order.total),
                'status': order.status,
                'created_at': order.created_at
            })

        return Response({
            'total_sales': float(total_sales),
            'total_orders': total_orders,
            'total_products': total_products,
            'total_customers': total_customers,
            'sales_chart': chart_data,
            'recent_orders': recent_orders
        })
    except Exception as e:
        import traceback
        return Response({
            'error': str(e),
            'trace': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
