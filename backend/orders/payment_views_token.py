@api_view(['GET'])
def payment_status_by_token(request, tenant_slug, token):
    """
    Get payment status by Flow token.
    
    GET /api/storefront/{tenant_slug}/payments/token/{token}
    
    Returns:
        {
            "order_id": "uuid",
            "order_number": "DEMO-STORE-000001",
            "payment_status": "completed",
            "payment_gateway": "Flow",
            "amount": "50000.00",
            "paid_at": "2025-12-18T19:00:00Z"
        }
    """
    try:
        # Get tenant
        tenant = get_object_or_404(Tenant, slug=tenant_slug, deleted_at__isnull=True)
        
        # Find payment by token
        payment = Payment.objects.filter(
            tenant=tenant,
            gateway_token=token
        ).select_related('order').first()
        
        if not payment:
            return Response(
                {'error': 'Payment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        order = payment.order
        
        return Response({
            'order_id': str(order.id),
            'order_number': order.order_number,
            'payment_id': str(payment.id),
            'payment_status': payment.status,
            'payment_gateway': payment.gateway,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'created_at': payment.created_at,
            'completed_at': payment.completed_at,
            'paid_at': order.paid_at
        })
        
    except Exception as e:
        logger.error(f'Error getting payment by token: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
