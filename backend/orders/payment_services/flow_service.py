"""
Flow payment gateway service implementation
https://www.flow.cl/docs/api.html
"""
import requests
import hashlib
import hmac
import json
import logging
from typing import Dict, Any
from decimal import Decimal
from django.conf import settings
from .base import PaymentGatewayService, PaymentGatewayError

logger = logging.getLogger(__name__)


class FlowService(PaymentGatewayService):
    """
    Flow payment gateway integration.
    Supports Flow's payment API for Chilean market.
    """
    
    def __init__(self, tenant=None):
        """
        Initialize Flow service with tenant-specific or global credentials.
        
        Args:
            tenant: Tenant instance (optional). If provided, uses tenant's config.
                   If None, falls back to global settings.
        """
        if tenant:
            # Try to get tenant-specific configuration
            try:
                from tenants.payment_config_models import PaymentGatewayConfig
                
                config = PaymentGatewayConfig.objects.filter(
                    tenant=tenant,
                    gateway='Flow',
                    is_active=True
                ).first()
                
                if config:
                    # Use tenant-specific credentials (decrypted automatically)
                    self.api_key = config.api_key
                    self.secret_key = config.secret_key
                    self.environment = 'production' if not config.is_sandbox else 'sandbox'
                    logger.info(f'Using Flow credentials for tenant: {tenant.slug}')
                else:
                    # No active config found, fall back to global
                    logger.warning(f'No active Flow config for tenant {tenant.slug}, using global settings')
                    self._load_global_settings()
            except Exception as e:
                logger.error(f'Error loading tenant Flow config: {e}')
                self._load_global_settings()
        else:
            # Use global settings
            self._load_global_settings()
        
        # Set API URL based on environment
        if self.environment == 'production':
            self.base_url = 'https://www.flow.cl/api'
        else:
            self.base_url = 'https://sandbox.flow.cl/api'
    
    def _load_global_settings(self):
        """Load credentials from global settings (fallback)"""
        self.api_key = settings.PAYMENT_GATEWAYS['FLOW']['API_KEY']
        self.secret_key = settings.PAYMENT_GATEWAYS['FLOW']['SECRET_KEY']
        self.environment = settings.PAYMENT_GATEWAYS['FLOW']['ENVIRONMENT']
    
    def _sign_params(self, params: Dict[str, Any]) -> str:
        """
        Generate signature for Flow API request.
        Flow requires parameters to be signed with HMAC-SHA256.
        """
        # Sort parameters alphabetically
        sorted_params = sorted(params.items())
        
        # Create string to sign (Flow format: key+value concatenated without separators)
        # Example: "amount5000apiKeyXXXXcurrencyCLP"
        params_string = ''.join([f"{k}{v}" for k, v in sorted_params])
        
        # Generate HMAC-SHA256 signature
        signature = hmac.new(
            self.secret_key.encode('utf-8'),
            params_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def create_payment(
        self,
        order,
        amount: Decimal,
        return_url: str,
        cancel_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a payment with Flow.
        
        Flow API endpoint: POST /payment/create
        """
        try:
            # Prepare payment parameters (all values must be strings for signature)
            params = {
                'apiKey': self.api_key,
                'commerceOrder': str(order.order_number),
                'subject': f'Orden {order.order_number}',
                'currency': 'CLP',
                'amount': str(int(amount)),  # Convert to string for signature
                'email': order.customer_email,
                'urlConfirmation': f'{settings.PAYMENT_WEBHOOK_URL}/payments/callback/Flow/?tenant={order.tenant.slug}',
                'urlReturn': return_url,
            }
            
            # Add optional parameters
            if kwargs.get('payment_method'):
                params['paymentMethod'] = kwargs['payment_method']
            
            # Sign parameters
            params['s'] = self._sign_params(params)
            
            # Log request (without signature)
            logger.info(f"Creating Flow payment for order {order.order_number}")
            logger.debug(f"Flow request params: {{k: v for k, v in params.items() if k != 's'}}")
            
            # Make API request
            response = requests.post(
                f'{self.base_url}/payment/create',
                data=params,
                timeout=30
            )
            
            
            # Check response
            if response.status_code != 200:
                # Log the full error response for debugging
                error_details = {
                    'status_code': response.status_code,
                    'response_text': response.text,
                    'request_params': {k: v for k, v in params.items() if k != 's'},  # Don't log signature
                }
                logger.error(f"Flow API error: {error_details}")
                
                raise PaymentGatewayError(
                    f'Flow API error: {response.status_code} - {response.text}',
                    gateway='Flow',
                    details=error_details
                )
            
            result = response.json()
            
            # Validate Flow response
            if not result.get('url') or not result.get('token'):
                logger.error(f"Invalid Flow response: {result}")
                raise PaymentGatewayError(
                    f'Invalid Flow API response: missing url or token',
                    gateway='Flow',
                    details={'response': result}
                )
            
            # Flow returns payment URL and token
            return {
                'payment_url': result.get('url') + '?token=' + result.get('token'),
                'transaction_id': result.get('flowOrder'),
                'token': result.get('token'),
                'raw_response': result
            }
            
        except requests.RequestException as e:
            logger.error(f'Flow API request failed: {e}')
            raise PaymentGatewayError(
                f'Failed to create payment: {str(e)}',
                gateway='Flow',
                details={'error': str(e)}
            )
    
    def verify_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify payment from Flow callback/webhook.
        
        Flow sends a POST request with token parameter.
        We need to call /payment/getStatus to verify.
        """
        try:
            token = payment_data.get('token')
            if not token:
                raise PaymentGatewayError(
                    'Missing token in payment data',
                    gateway='Flow'
                )
            
            # Get payment status from Flow
            return self.get_payment_status(token)
            
        except Exception as e:
            logger.error(f'Flow payment verification failed: {e}')
            raise PaymentGatewayError(
                f'Payment verification failed: {str(e)}',
                gateway='Flow',
                details={'error': str(e)}
            )
    
    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Query payment status from Flow.
        
        Flow API endpoint: GET /payment/getStatus
        transaction_id can be either flowOrder or token
        """
        try:
            # Prepare parameters
            params = {
                'apiKey': self.api_key,
                'token': transaction_id
            }
            
            # Sign parameters
            params['s'] = self._sign_params(params)
            
            # Make API request
            response = requests.get(
                f'{self.base_url}/payment/getStatus',
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                raise PaymentGatewayError(
                    f'Flow API error: {response.status_code}',
                    gateway='Flow',
                    details={'response': response.text}
                )
            
            result = response.json()
            
            # Map Flow status to our status
            flow_status = result.get('status')
            status_mapping = {
                1: 'pending',      # Pendiente de pago
                2: 'completed',    # Pagada
                3: 'failed',       # Rechazada
                4: 'cancelled'     # Anulada
            }
            
            return {
                'status': status_mapping.get(flow_status, 'pending'),
                'transaction_id': result.get('flowOrder'),
                'amount': Decimal(result.get('amount', 0)),
                'currency': result.get('currency', 'CLP'),
                'payment_date': result.get('paymentDate'),
                'raw_response': result
            }
            
        except requests.RequestException as e:
            logger.error(f'Flow status query failed: {e}')
            raise PaymentGatewayError(
                f'Failed to get payment status: {str(e)}',
                gateway='Flow',
                details={'error': str(e)}
            )
    
    def validate_webhook_signature(
        self,
        payload: Dict[str, Any],
        signature: str
    ) -> bool:
        """
        Validate Flow webhook signature.
        
        Flow signs the callback parameters with the same method as requests.
        """
        try:
            # Remove signature from payload for validation
            params = {k: v for k, v in payload.items() if k != 's'}
            
            # Calculate expected signature
            expected_signature = self._sign_params(params)
            
            # Compare signatures
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f'Flow signature validation failed: {e}')
            return False
