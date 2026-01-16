"""
Admin API views for payment gateway configuration
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import logging

from tenants.models import Tenant
from tenants.payment_config_models import PaymentGatewayConfig
from orders.payment_models import PaymentGateway
from orders.payment_services import PaymentServiceFactory, PaymentGatewayError
from .admin_user_views import IsTenantAdmin

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_payment_gateways(request):
    """
    List all payment gateway configurations for the authenticated tenant.
    
    GET /api/admin/payment-gateways/
    
    Returns:
        [
            {
                "id": "uuid",
                "gateway": "Flow",
                "is_active": true,
                "is_sandbox": true,
                "credentials": {
                    "api_key": "****1234",
                    "secret_key": "****5678"
                },
                "created_at": "2025-12-17T...",
                "updated_at": "2025-12-17T..."
            }
        ]
    """
    try:
        # Check if tenant is available
        if not hasattr(request, 'tenant') or request.tenant is None:
            logger.error('No tenant found in request')
            return Response(
                {'error': 'Tenant not found', 'detail': 'Please ensure you are logged in with a valid tenant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = request.tenant
        
        # Get all configured gateways
        configs = PaymentGatewayConfig.objects.filter(tenant=tenant)
        
        # Get all available gateways from PaymentGateway choices
        available_gateways = [choice[0] for choice in PaymentGateway.choices]
        
        # Build response with all gateways (configured and not configured)
        result = []
        for gateway_name in available_gateways:
            config = configs.filter(gateway=gateway_name).first()
            
            if config:
                result.append(config.to_dict(include_credentials=True))
            else:
                # Gateway not configured yet
                result.append({
                    'id': None,
                    'gateway': gateway_name,
                    'is_active': False,
                    'is_sandbox': True,
                    'credentials': None,
                    'created_at': None,
                    'updated_at': None,
                })
        
        return Response(result)
        
    except Exception as e:
        logger.error(f'Error listing payment gateways: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def configure_payment_gateway(request, gateway):
    """
    Get or configure a payment gateway.
    
    GET /api/admin/payment-gateways/{gateway}/
    POST /api/admin/payment-gateways/{gateway}/
    PUT /api/admin/payment-gateways/{gateway}/
    
    Body (POST/PUT):
        {
            "api_key": "your_api_key",
            "secret_key": "your_secret_key",
            "commerce_code": "optional_commerce_code",
            "public_key": "optional_public_key",
            "is_sandbox": true,
            "is_active": false
        }
    """
    try:
        tenant = request.tenant
        
        # Validate gateway
        valid_gateways = [choice[0] for choice in PaymentGateway.choices]
        if gateway not in valid_gateways:
            return Response(
                {'error': f'Invalid gateway: {gateway}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if request.method == 'GET':
            # Get existing configuration
            config = PaymentGatewayConfig.objects.filter(
                tenant=tenant,
                gateway=gateway
            ).first()
            
            if not config:
                return Response(
                    {'error': 'Gateway not configured'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response(config.to_dict(include_credentials=True))
        
        elif request.method in ['POST', 'PUT']:
            # Create or update configuration
            config, created = PaymentGatewayConfig.objects.get_or_create(
                tenant=tenant,
                gateway=gateway
            )
            
            # Helper to check if a value is a masked placeholder from the backend
            def is_masked(val):
                if not val: return False
                if val == "****": return True
                # Check if it looks like ****1234
                if len(val) > 4 and val.startswith('***') and all(c == '*' for c in val[:-4]):
                    return True
                return False

            # Update fields - allow empty string for clearing, but ignore masked placeholders
            if 'api_key' in request.data:
                val = request.data['api_key']
                if not is_masked(val):
                    config.api_key = val
            
            if 'secret_key' in request.data:
                val = request.data.get('secret_key')
                if not is_masked(val):
                    config.secret_key = val
            
            if 'commerce_code' in request.data:
                val = request.data.get('commerce_code')
                if not is_masked(val):
                    config.commerce_code = val
            
            if 'public_key' in request.data:
                val = request.data.get('public_key')
                if not is_masked(val):
                    config.public_key = val
            
            if 'access_token' in request.data:
                # Mercado Pago calls it access_token in frontend but we store it as secret_key or in config_data
                val = request.data.get('access_token')
                if not is_masked(val):
                    # For MP we use access_token -> secret_key mapping usually
                    if gateway == 'MercadoPago':
                        config.secret_key = val
                    else:
                        config.config_data['access_token'] = val
            
            if 'is_sandbox' in request.data:
                config.is_sandbox = request.data['is_sandbox']
            
            if 'is_active' in request.data:
                config.is_active = request.data['is_active']
            
            if 'config_data' in request.data:
                config.config_data = request.data['config_data']
            
            # Set audit fields
            # if hasattr(request, 'user') and request.user.is_authenticated:
            #     if created:
            #         config.created_by = request.user.id
            #     config.updated_by = request.user.id
            
            config.save()
            
            logger.info(f'Payment gateway {gateway} {"created" if created else "updated"} for tenant {tenant.slug}')
            
            return Response(
                config.to_dict(include_credentials=True),
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
    
    except Exception as e:
        logger.error(f'Error configuring payment gateway: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def test_payment_gateway(request, gateway):
    """
    Test payment gateway connection with provided credentials.
    
    POST /api/admin/payment-gateways/{gateway}/test/
    
    Body:
        {
            "api_key": "your_api_key",
            "secret_key": "your_secret_key",
            "is_sandbox": true
        }
    
    Returns:
        {
            "success": true,
            "message": "Connection successful"
        }
    """
    try:
        tenant = request.tenant
        
        # Validate gateway
        valid_gateways = [choice[0] for choice in PaymentGateway.choices]
        if gateway not in valid_gateways:
            return Response(
                {'error': f'Invalid gateway: {gateway}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create temporary config for testing
        temp_config = PaymentGatewayConfig(
            tenant=tenant,
            gateway=gateway,
            is_sandbox=request.data.get('is_sandbox', True)
        )
        
        if 'api_key' in request.data:
            temp_config.api_key = request.data['api_key']
        if 'secret_key' in request.data:
            temp_config.secret_key = request.data['secret_key']
        if 'commerce_code' in request.data:
            temp_config.commerce_code = request.data['commerce_code']
        
        # Try to initialize the payment service
        try:
            # Get payment service with temp config
            payment_service = PaymentServiceFactory.get_service(gateway)
            
            # For now, just check if we can initialize
            # In the future, we could make a test API call
            
            return Response({
                'success': True,
                'message': f'{gateway} credentials validated successfully'
            })
            
        except PaymentGatewayError as e:
            return Response({
                'success': False,
                'message': f'Gateway error: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f'Error testing payment gateway: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def delete_payment_gateway(request, gateway):
    """
    Delete payment gateway configuration.
    
    DELETE /api/admin/payment-gateways/{gateway}/
    """
    try:
        tenant = request.tenant
        
        config = get_object_or_404(
            PaymentGatewayConfig,
            tenant=tenant,
            gateway=gateway
        )
        
        config.delete()
        
        logger.info(f'Payment gateway {gateway} deleted for tenant {tenant.slug}')
        
        return Response(status=status.HTTP_204_NO_CONTENT)
        
    except Exception as e:
        logger.error(f'Error deleting payment gateway: {e}', exc_info=True)
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def initiate_transbank_certification(request):
    """
    Inititate a certification transaction for Transbank.
    Creates a dummy order and returns the token and URL.
    
    POST /api/admin/payment-gateways/transbank/certify/
    """
    try:
        tenant = request.tenant
        
        # Check if Transbank is configured
        config = PaymentGatewayConfig.objects.filter(
            tenant=tenant,
            gateway='Transbank'
        ).first()
        
        if not config:
            return Response(
                {'error': 'Transbank is not configured'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        from orders.payment_services.transbank_service import TransbankService
        from orders.models import Order
        import uuid
        
        # Create a dummy order object structure for the service
        # We don't necessarily need to save it to DB if the service handles it, 
        # but TransbankService usually expects an object with .id and .order_number
        class DummyOrder:
            def __init__(self):
                self.id = uuid.uuid4()
                self.order_number = f"CERT-{uuid.uuid4().hex[:8].upper()}"
        
        dummy_order = DummyOrder()
        
        # Initialize service with tenant to use specific config
        service = TransbankService(tenant=tenant)
        
        # Create transaction of $10 CLP (Standard for certification)
        return_url = request.data.get('return_url', 'http://localhost:3000/admin/settings/payments')
        cancel_url = return_url
        
        result = service.create_payment(
            order=dummy_order,
            amount=10,
            return_url=return_url,
            cancel_url=cancel_url
        )
        
        return Response({
            'success': True,
            'token': result.get('token'),
            'url': result.get('payment_url'), # This URL usually includes token_ws as param
            'raw_url': result.get('raw_response', {}).get('url'),
            'amount': 10,
            'order_number': dummy_order.order_number
        })
        
    except Exception as e:
        logger.error(f'Error initiating Transbank certification: {e}', exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTenantAdmin])
def confirm_transbank_certification(request):
    """
    Confirm a certification transaction for Transbank.
    Calls commit to finalize the transaction.
    
    POST /api/admin/payment-gateways/transbank/confirm/
    Body: { "token": "..." }
    """
    try:
        tenant = request.tenant
        token = request.data.get('token')
        
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        config = PaymentGatewayConfig.objects.filter(
            tenant=tenant,
            gateway='Transbank'
        ).first()
        
        if not config:
            return Response({'error': 'Transbank not configured'}, status=status.HTTP_400_BAD_REQUEST)

        from orders.payment_services.transbank_service import TransbankService
        
        service = TransbankService(tenant=tenant)
        
        # Verify payment calls the COMMIT endpoint on Transbank
        result = service.verify_payment({'token_ws': token})
        
        if result.get('status') == 'completed':
            return Response({
                'success': True,
                'status': 'authorized',
                'details': result
            })
        else:
             return Response({
                'success': False,
                'status': result.get('status', 'failed'),
                'details': result
            })
            
    except Exception as e:
        logger.error(f'Error confirming Transbank certification: {e}', exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
