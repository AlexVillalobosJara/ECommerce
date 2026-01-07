"""
Payment API views for handling payment transactions
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
import logging
import traceback

from tenants.models import Tenant
from .models import Order, OrderStatus
from .payment_models import Payment, PaymentStatus, PaymentWebhookLog
from .payment_services import PaymentServiceFactory, PaymentGatewayError
from .email_service import send_order_confirmation_email, send_new_order_notification
from django.conf import settings

logger = logging.getLogger(__name__)


@api_view(['POST'])
def initiate_payment(request):
    """
    Initiate payment process for an order.
    
    POST /api/storefront/payments/initiate/?tenant=slug
    
    Body:
        {
            "order_id": "uuid",
            "gateway": "Flow",  # Optional, defaults to Flow
            "return_url": "http://...",  # Optional, uses default if not provided
            "cancel_url": "http://..."   # Optional
        }
    
    Returns:
        {
            "payment_id": "uuid",
            "payment_url": "https://...",
            "gateway": "Flow"
        }
    """
    try:
        # Get tenant from query parameter
        tenant_slug = request.GET.get('tenant')
        if not tenant_slug:
            # Fallback to request.tenant if middleware resolved it
            tenant = getattr(request, 'tenant', None)
            if tenant:
                tenant_slug = tenant.slug
            else:
                return Response({'error': 'tenant parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get tenant
        tenant = get_object_or_404(Tenant, slug=tenant_slug, deleted_at__isnull=True)
        
        # Get request data
        order_id = request.data.get('order_id')
        gateway = request.data.get('gateway', 'Flow')
        
        logger.info(f"Payment initiation requested for tenant {tenant_slug}, order {order_id}, gateway {gateway}")
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get order
        order = get_object_or_404(
            Order,
            id=order_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
        
        # Build return URLs with order ID and tenant for callback
        # Use request.build_absolute_uri() to handle SaaS custom domains dynamically
        # Use the internal slug (not custom_domain) for backend-to-backend consistency
        return_url = request.build_absolute_uri(
            f"/api/storefront/payments/return/{gateway}/?order={order_id}&tenant={order.tenant.slug}"
        )
        
        confirmation_url = request.build_absolute_uri(
            f"/api/storefront/payments/callback/{gateway}/?tenant={order.tenant.slug}"
        )
        
        base_frontend_url = request.build_absolute_uri('/')
        if base_frontend_url.endswith('/'):
            base_frontend_url = base_frontend_url[:-1]
            
        cancel_url = request.data.get('cancel_url', f"{base_frontend_url}/payment/cancelled?order={order_id}&tenant={tenant_slug}")
        
        # Validate order can be paid
        valid_types = ['Sale', 'Quote']
        if order.order_type not in valid_types:
            return Response(
                {'error': f'Invalid order type for payment: {order.order_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = ['Draft', 'PendingPayment', 'QuoteSent', 'QuoteApproved']
        if order.status not in valid_statuses:
            return Response(
                {'error': f'Order cannot be paid in status: {order.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment record
        payment = Payment.objects.create(
            tenant=tenant,
            order=order,
            gateway=gateway,
            status=PaymentStatus.PENDING,
            amount=order.total,
            currency='CLP'
        )
        
        try:
            # Get payment service with tenant-specific credentials
            payment_service = PaymentServiceFactory.get_service(gateway, tenant=tenant)
            
            # Create payment with gateway
            payment_result = payment_service.create_payment(
                order=order,
                amount=order.total,
                return_url=return_url,
                cancel_url=cancel_url,
                urlConfirmation=confirmation_url # Pass dynamic confirmation URL
            )
            
            # Update payment record
            payment.gateway_transaction_id = payment_result.get('transaction_id')
            payment.gateway_payment_url = payment_result.get('payment_url')
            payment.gateway_token = payment_result.get('token')
            payment.gateway_response = payment_result.get('raw_response')
            payment.status = PaymentStatus.PROCESSING
            payment.save()
            
            # Update order
            order.payment_gateway = gateway
            order.payment_status = PaymentStatus.PROCESSING
            order.status = OrderStatus.PENDING_PAYMENT
            order.save()
            
            logger.info(f'Payment initiated for order {order.order_number}: {payment.id}')
            
            return Response({
                'payment_id': str(payment.id),
                'payment_url': payment_result.get('payment_url'),
                'gateway': gateway,
                'transaction_id': payment_result.get('transaction_id')
            })
            
        except PaymentGatewayError as e:
            # Update payment status
            payment.status = PaymentStatus.FAILED
            payment.error_message = str(e)
            payment.save()
            
            logger.error(f'Payment gateway error for order {order.order_number}: {e}')
            
            return Response(
                {'error': f'Payment gateway error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as inner_e:
            logger.error(f'Critical error during service execution for order {order.order_number}: {inner_e}')
            logger.error(traceback.format_exc())
            payment.status = PaymentStatus.FAILED
            payment.error_message = f"Internal Exception: {str(inner_e)}"
            payment.save()
            return Response(
                {'error': f'Internal transition error: {str(inner_e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f'Global error initiating payment: {e}')
        logger.error(traceback.format_exc())
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST', 'GET'])
def payment_return_handler(request, gateway):
    """
    Handle browser redirect from payment gateway.
    Converts POST request (from Flow/others) to a GET redirect to the frontend.
    
    IMPORTANT: This also verifies payment status as a fallback in case webhooks don't arrive.
    """
    token = request.data.get('token') if hasattr(request, 'data') else request.POST.get('token')
    if not token and request.method == 'GET':
        token = request.GET.get('token')
        
    order_id = request.GET.get('order')
    tenant_slug = request.GET.get('tenant')
    
    logger.info(f"Payment return handled for {gateway}. Order: {order_id}, Tenant: {tenant_slug}, Token: {token}")

    # FALLBACK PAYMENT VERIFICATION
    # If we have a token, verify the payment status with the gateway
    # This ensures emails are sent even if webhooks don't arrive
    if token and order_id:
        try:
            logger.info(f"Verifying payment status for token {token}")
            
            # Get tenant for payment service
            tenant = Tenant.objects.filter(
                Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
                deleted_at__isnull=True
            ).first()
            
            if tenant:
                # Get payment service
                payment_service = PaymentServiceFactory.get_service(gateway, tenant=tenant)
                
                # Verify payment with gateway
                verification_result = payment_service.get_payment_status(token)
                logger.info(f"Payment verification result: {verification_result}")
                
                # Find the payment record
                payment = Payment.objects.filter(
                    tenant=tenant,
                    gateway_token=token
                ).first()
                
                if payment and verification_result.get('status') == 'completed':
                    # Check if payment is not already completed
                    if payment.status != PaymentStatus.COMPLETED:
                        logger.info(f"Updating payment {payment.id} to COMPLETED")
                        
                        with transaction.atomic():
                            # Update payment
                            payment.status = PaymentStatus.COMPLETED
                            payment.completed_at = timezone.now()
                            payment.gateway_transaction_id = verification_result.get('transaction_id')
                            payment.gateway_response = verification_result.get('raw_response')
                            payment.save()
                            
                            # Update order
                            order = payment.order
                            order.status = OrderStatus.PAID
                            order.paid_at = timezone.now()
                            order.save()
                            
                            logger.info(f"Order {order.order_number} marked as PAID - emails will be sent by signals")
                    else:
                        logger.info(f"Payment {payment.id} already completed")
                        
        except Exception as e:
            logger.error(f"Error verifying payment on return: {e}", exc_info=True)
            # Don't fail the redirect if verification fails
            pass

    # Construct frontend redirect URL
    # Preferred: Use tenant's custom domain if available
    tenant = None
    if tenant_slug:
        # Flexible lookup: matches slug OR custom_domain
        tenant = Tenant.objects.filter(
            Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
            deleted_at__isnull=True
        ).first()

    if tenant and tenant.custom_domain:
        # Check if custom domain has protocol, if not add https
        base_url = tenant.custom_domain
        if not base_url.startswith(('http://', 'https://')):
            base_url = f"https://{base_url}"
    else:
        # Fallback to FRONTEND_URL setting
        base_url = settings.FRONTEND_URL
    
    if base_url.endswith('/'):
        base_url = base_url[:-1]
    
    # We pass the internal tenant slug to the frontend to ensure stable state
    final_slug = tenant.slug if tenant else tenant_slug
    redirect_url = f"{base_url}/payment/callback?order={order_id}&tenant={final_slug}"
    
    if token:
        redirect_url += f"&token={token}"
        
    return HttpResponseRedirect(redirect_url)


@api_view(['POST', 'GET'])
def payment_callback(request, gateway):
    """
    Handle payment callback/webhook from gateway.
    
    POST/GET /api/storefront/payments/callback/{gateway}/?tenant=slug
    
    Flow sends: token parameter
    """
    try:
        # Get tenant from query parameter
        tenant_slug = request.GET.get('tenant')
        if not tenant_slug:
            return Response({'error': 'tenant parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get tenant
        tenant = get_object_or_404(Tenant, slug=tenant_slug, deleted_at__isnull=True)
        
        # Get payment data from request
        if request.method == 'POST':
            payment_data = request.data.dict() if hasattr(request.data, 'dict') else request.data
        else:
            payment_data = request.query_params.dict()
        
        # Log webhook
        webhook_log = PaymentWebhookLog.objects.create(
            tenant=tenant,
            gateway=gateway,
            webhook_data=payment_data,
            headers=dict(request.headers) if hasattr(request, 'headers') else {}
        )
        
        try:
            # Get payment service with tenant-specific credentials
            payment_service = PaymentServiceFactory.get_service(gateway, tenant=tenant)
            
            # Verify payment
            verification_result = payment_service.verify_payment(payment_data)
            
            # Mark webhook as valid
            webhook_log.signature_valid = True
            webhook_log.save()
            
            # Find payment by transaction ID or token
            transaction_id = verification_result.get('transaction_id')
            token = payment_data.get('token')
            
            payment = None
            if transaction_id:
                payment = Payment.objects.filter(
                    tenant=tenant,
                    gateway_transaction_id=transaction_id
                ).first()
            
            if not payment and token:
                payment = Payment.objects.filter(
                    tenant=tenant,
                    gateway_token=token
                ).first()
            
            if not payment:
                logger.error(f'Payment not found for transaction {transaction_id} or token {token}')
                webhook_log.processing_error = 'Payment not found'
                webhook_log.save()
                return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update webhook log with payment
            webhook_log.payment = payment
            webhook_log.save()
            
            # Update payment status
            with transaction.atomic():
                payment_status = verification_result.get('status')
                
                if payment_status == 'completed':
                    payment.status = PaymentStatus.COMPLETED
                    payment.completed_at = timezone.now()
                    payment.gateway_response = verification_result.get('raw_response')
                    payment.save()
                    
                    # Update order
                    order = payment.order
                    order.payment_status = PaymentStatus.COMPLETED
                    order.status = OrderStatus.PAID
                    order.paid_at = timezone.now()
                    order.save()
                    
                    logger.info(f'Payment completed for order {order.order_number}')
                    
                    logger.info(f'Payment completed for order {order.order_number}')
                    
                    # Emails handled by signals

                    
                elif payment_status == 'failed':
                    payment.status = PaymentStatus.FAILED
                    payment.error_message = verification_result.get('error_message', 'Payment failed')
                    payment.save()
                    
                    order = payment.order
                    order.payment_status = PaymentStatus.FAILED
                    order.save()
                    
                    logger.warning(f'Payment failed for order {order.order_number}')
                    
                elif payment_status == 'cancelled':
                    payment.status = PaymentStatus.CANCELLED
                    payment.save()
                    
                    order = payment.order
                    order.payment_status = PaymentStatus.CANCELLED
                    order.save()
                    
                    logger.info(f'Payment cancelled for order {order.order_number}')
            
            webhook_log.processed = True
            webhook_log.processed_at = timezone.now()
            webhook_log.save()
            
            return Response({'status': 'success', 'payment_status': payment_status})
            
        except PaymentGatewayError as e:
            logger.error(f'Payment verification error: {e}')
            webhook_log.processing_error = str(e)
            webhook_log.save()
            return Response(
                {'error': f'Verification error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f'Error processing payment callback: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def payment_status_check(request, order_id):
    """
    Check payment status for an order.
    
    GET /api/storefront/payments/status/{order_id}/?tenant=slug
    
    Returns:
        {
            "order_id": "uuid",
            "payment_status": "completed",
            "payment_gateway": "Flow",
            "amount": "50000.00",
            "paid_at": "2025-12-17T19:00:00Z"
        }
    """
    try:
        # Get tenant from query parameter
        tenant_slug = request.GET.get('tenant')
        if not tenant_slug:
            return Response({'error': 'tenant parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get tenant - flexible lookup by slug or custom_domain
        tenant = Tenant.objects.filter(
            Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
            deleted_at__isnull=True
        ).first()
        
        if not tenant:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get order
        order = get_object_or_404(
            Order,
            id=order_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
        
        # Get latest payment
        payment = order.payments.order_by('-created_at').first()
        
        if not payment:
            return Response({
                'order_id': str(order.id),
                'payment_status': None,
                'message': 'No payment found for this order'
            })
        
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
        logger.error(f'Error checking payment status: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def payment_status_by_token(request, token):
    """
    Get payment status by Flow token.
    
    GET /api/storefront/payments/token/{token}/?tenant=slug
    
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
        # Get tenant from query parameter
        tenant_slug = request.GET.get('tenant')
        if not tenant_slug:
            return Response({'error': 'tenant parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get tenant - flexible lookup by slug or custom_domain
        tenant = Tenant.objects.filter(
            Q(slug=tenant_slug) | Q(custom_domain=tenant_slug),
            deleted_at__isnull=True
        ).first()
        
        if not tenant:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
        
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


@api_view(['POST'])
def verify_payment_manually(request, order_id):
    """
    Manually verify payment status by querying Flow API directly.
    
    This is a workaround for when webhooks cannot reach localhost.
    
    POST /api/storefront/payments/verify/{order_id}/?tenant={tenant_slug}
    """
    try:
        # Get tenant from query parameter
        tenant_slug = request.GET.get('tenant')
        if not tenant_slug:
            return Response({'error': 'tenant parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get tenant
        tenant = get_object_or_404(Tenant, slug=tenant_slug, deleted_at__isnull=True)
        
        # Get order
        order = get_object_or_404(
            Order,
            id=order_id,
            tenant=tenant,
            deleted_at__isnull=True
        )
        
        # Get payment for this order
        payment = Payment.objects.filter(
            order=order,
            tenant=tenant
        ).order_by('-created_at').first()
        
        if not payment:
            return Response(
                {'error': 'No payment found for this order'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not payment.gateway_token:
            return Response(
                {'error': 'Payment token not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Query Flow API directly to get payment status
        payment_service = PaymentServiceFactory.get_service(payment.gateway, tenant)
        flow_status = payment_service.get_payment_status(payment.gateway_token)
        
        # Update payment status based on Flow response
        new_status = flow_status.get('status')
        
        # Update payment if status changed
        if new_status and new_status != payment.status:
            payment.status = new_status
            if new_status == 'completed':
                payment.completed_at = timezone.now()
            payment.save()
            logger.info(f'Manually verified payment {payment.id} - Status updated to {new_status}')
        
        # Always sync order status with payment status
        if payment.status == 'completed' and order.status != OrderStatus.PAID:
            order.payment_status = 'paid'
            order.status = OrderStatus.PAID
            order.paid_at = timezone.now()
            order.save()
            logger.info(f'Updated order {order.id} status to Paid')
            
            order.paid_at = timezone.now()
            order.save()
            logger.info(f'Updated order {order.id} status to Paid')
            
            # Emails handled by signals

        
        return Response({
            'order_id': str(order.id),
            'order_number': order.order_number,
            'payment_id': str(payment.id),
            'payment_status': payment.status,
            'payment_gateway': payment.gateway,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'verified': True,
            'flow_data': flow_status
        })
        
    except Exception as e:
        logger.error(f'Error manually verifying payment: {e}', exc_info=True)
        return Response(
            {'error': f'Internal server error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

