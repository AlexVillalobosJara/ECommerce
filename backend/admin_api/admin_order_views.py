from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .admin_user_views import IsTenantAdmin
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count
from orders.models import Order, OrderItem
from .admin_order_serializers import (
    AdminOrderListSerializer,
    AdminOrderDetailSerializer,
    AdminOrderStatusUpdateSerializer
)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def order_list(request):
    """
    GET: List all orders with filters
    """
    tenant = request.tenant
    
    # Get all orders for this tenant with annotation to avoid N+1
    orders = Order.objects.filter(
        tenant=tenant,
        deleted_at__isnull=True
    ).select_related('customer').annotate(
        annotated_items_count=Count('items')
    )
    
    # Apply filters
    status_filter = request.GET.get('status')
    if status_filter:
        orders = orders.filter(status=status_filter)
    
    order_type = request.GET.get('type')
    if order_type:
        orders = orders.filter(order_type=order_type)
    
    search = request.GET.get('search')
    if search:
        orders = orders.filter(
            Q(order_number__icontains=search) |
            Q(customer_email__icontains=search) |
            Q(shipping_recipient_name__icontains=search)
        )
    
    # Date range filter
    date_from = request.GET.get('date_from')
    if date_from:
        orders = orders.filter(created_at__gte=date_from)
    
    date_to = request.GET.get('date_to')
    if date_to:
        orders = orders.filter(created_at__lte=date_to)
    
    # Order by created_at desc
    orders = orders.order_by('-created_at')
    
    # Manual Pagination
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 50
    result_page = paginator.paginate_queryset(orders, request)
    
    serializer = AdminOrderListSerializer(result_page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def order_detail(request, pk):
    """
    GET: Get single order detail
    """
    try:
        tenant = request.tenant
        
        if not tenant:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order = Order.objects.select_related('customer').prefetch_related('items').get(
                id=pk,
                tenant=tenant,
                deleted_at__isnull=True
            )
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AdminOrderDetailSerializer(order)
        return Response(serializer.data)
    
    except Exception as e:
        # Return error details for debugging
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc(),
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def order_update_status(request, pk):
    """
    POST: Update order status
    """
    tenant = request.tenant
    
    try:
        order = Order.objects.get(
            id=pk,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = AdminOrderStatusUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    new_status = serializer.validated_data['status']
    notes = serializer.validated_data.get('notes', '')
    
    # Update status
    order.status = new_status
    
    # Update timestamps based on status
    now = timezone.now()
    if new_status == 'Paid' and not order.paid_at:
        order.paid_at = now
    elif new_status == 'Shipped' and not order.shipped_at:
        order.shipped_at = now
    elif new_status == 'Delivered' and not order.delivered_at:
        order.delivered_at = now
    elif new_status == 'Cancelled' and not order.cancelled_at:
        order.cancelled_at = now
    
    # Add notes to internal notes
    if notes:
        if order.internal_notes:
            order.internal_notes += f"\n\n[{now.strftime('%Y-%m-%d %H:%M')}] Status changed to {new_status}: {notes}"
        else:
            order.internal_notes = f"[{now.strftime('%Y-%m-%d %H:%M')}] Status changed to {new_status}: {notes}"
    
    order.save()
    
    detail_serializer = AdminOrderDetailSerializer(order)
    return Response(detail_serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def order_cancel(request, pk):
    """
    POST: Cancel an order
    """
    tenant = request.tenant
    
    try:
        order = Order.objects.get(
            id=pk,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if order can be cancelled
    if not order.can_cancel:
        return Response(
            {'error': f'Cannot cancel order in status: {order.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Cancel the order
    order.status = 'Cancelled'
    order.cancelled_at = timezone.now()
    
    # Add cancellation note
    reason = request.data.get('reason', 'No reason provided')
    if order.internal_notes:
        order.internal_notes += f"\n\n[{timezone.now().strftime('%Y-%m-%d %H:%M')}] Order cancelled: {reason}"
    else:
        order.internal_notes = f"[{timezone.now().strftime('%Y-%m-%d %H:%M')}] Order cancelled: {reason}"
    
    order.save()
    
    detail_serializer = AdminOrderDetailSerializer(order)
    return Response(detail_serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def order_stats(request):
    """
    GET: Get order statistics
    """
    try:
        tenant = request.tenant
        
        if not tenant:
            # Return empty stats if no tenant
            return Response({
                'total': 0,
                'by_status': {
                    'Draft': 0,
                    'Pending': 0,
                    'Paid': 0,
                    'Processing': 0,
                    'Shipped': 0,
                    'Delivered': 0,
                    'Cancelled': 0
                },
                'by_type': {
                    'Sale': 0,
                    'Quote': 0
                }
            })
        
        # Get counts by status
        stats = {
            'total': Order.objects.filter(tenant=tenant, deleted_at__isnull=True).count(),
            'by_status': {},
            'by_type': {}
        }
        
        # Count by status - use exact values from PostgreSQL enum
        for status_value in ['Draft', 'PendingPayment', 'Paid', 'QuoteRequested', 'QuoteSent', 'QuoteApproved', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded']:
            count = Order.objects.filter(
                tenant=tenant,
                status=status_value,
                deleted_at__isnull=True
            ).count()
            stats['by_status'][status_value] = count
        
        # Count by order type
        for order_type in ['Sale', 'Quote']:
            count = Order.objects.filter(
                tenant=tenant,
                order_type=order_type,
                deleted_at__isnull=True
            ).count()
            stats['by_type'][order_type] = count
        
        return Response(stats)
    
    except Exception as e:
        # Return error details for debugging
        import traceback
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc(),
            'type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def respond_quote(request, pk):
    """
    POST: Respond to a quote request with pricing
    """
    import logging
    logger = logging.getLogger(__name__)
    
    from decimal import Decimal
    from django.db import transaction
    
    tenant = request.tenant
    
    try:
        order = Order.objects.get(
            id=pk,
            tenant=tenant,
            deleted_at__isnull=True
        )
    except Order.DoesNotExist:
        return Response(
            {'error': 'Order not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if order.order_type != 'Quote':
        return Response(
            {'error': 'This order is not a quote request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Allow re-sending quote if already Sent (for updates)
    if order.status not in ['QuoteRequested', 'QuoteSent']:
        logger.warning(f"Order {pk} has invalid status for quote response: {order.status}")
        return Response(
            {'error': f'Quote cannot be responded to in status {order.status}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    quote_items = request.data.get('quote_items', {})
    quote_valid_until = request.data.get('quote_valid_until')
    internal_notes = request.data.get('internal_notes', '')
    
    if not quote_items:
        return Response(
            {'error': 'Quote items are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not quote_valid_until:
        return Response(
            {'error': 'Quote valid until date is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    with transaction.atomic():
        # Update order items with quoted prices
        subtotal = Decimal('0')
        tax_rate = Decimal('0.19')
        
        for item in order.items.all():
            item_price = quote_items.get(str(item.id))
            if item_price:
                unit_price = Decimal(str(item_price))
                item.unit_price = unit_price
                item.subtotal = unit_price * item.quantity
                item.tax_amount = item.subtotal * tax_rate
                item.total = item.subtotal + item.tax_amount
                item.save()
                subtotal += item.subtotal
        
        # Recalculate order totals
        tax_amount = subtotal * tax_rate
        total = subtotal + tax_amount + order.shipping_cost
        
        order.subtotal = subtotal
        order.tax_amount = tax_amount
        order.total = total
        order.status = 'QuoteSent'
        order.quote_valid_until = quote_valid_until
        order.internal_notes = internal_notes
        order.save()
    
    
    
    # Email notification is now handled automatically by signals.py
    
    # Return updated order
    serializer = AdminOrderDetailSerializer(order)
    return Response(serializer.data)
