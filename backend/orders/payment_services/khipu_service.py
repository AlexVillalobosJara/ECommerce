"""
Khipu payment gateway service implementation
https://khipu.com/page/api-referencia-v2
"""
import requests
import hashlib
import hmac
import logging
from typing import Dict, Any
from decimal import Decimal
from django.conf import settings
from .base import PaymentGatewayService, PaymentGatewayError

logger = logging.getLogger(__name__)


class KhipuService(PaymentGatewayService):
    """
    Khipu payment gateway integration.
    """
    
    def __init__(self, tenant=None):
        """
        Initialize Khipu service.
        """
        if tenant:
            try:
                from tenants.payment_config_models import PaymentGatewayConfig
                config = PaymentGatewayConfig.objects.filter(
                    tenant=tenant,
                    gateway='Khipu',
                    is_active=True
                ).first()
                
                if config:
                    self.receiver_id = config.api_key # Using api_key field for receiver_id
                    self.secret = config.secret_key
                    logger.info(f'Using Khipu credentials for tenant: {tenant.slug}')
                else:
                    self._load_global_settings()
            except Exception as e:
                logger.error(f'Error loading tenant Khipu config: {e}')
                self._load_global_settings()
        else:
            self._load_global_settings()
            
        self.base_url = 'https://khipu.com/api/2.0'

    def _load_global_settings(self):
        try:
            config = settings.PAYMENT_GATEWAYS.get('KHIPU', {})
            self.receiver_id = config.get('RECEIVER_ID', '')
            self.secret = config.get('SECRET', '')
        except Exception:
            self.receiver_id = ''
            self.secret = ''

    def _sign(self, method: str, url: str, params: Dict[str, Any]) -> str:
        """
        Generate Khipu signature.
        """
        import urllib.parse
        
        # Sort keys
        keys = sorted(params.keys())
        
        # Encode params
        encoded_params = []
        for k in keys:
            encoded_params.append(f"{urllib.parse.quote(k)}={urllib.parse.quote(str(params[k]))}")
        
        query_string = '&'.join(encoded_params)
        
        # String to sign: METHOD + & + URL + & + PARAMS
        to_sign = f"{method.upper()}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(query_string, safe='')}"
        
        signature = hmac.new(
            self.secret.encode('utf-8'),
            to_sign.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return f"{self.receiver_id}:{signature}"

    def create_payment(
        self,
        order,
        amount: Decimal,
        return_url: str,
        cancel_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a payment in Khipu.
        """
        try:
            url = f"{self.base_url}/payments"
            params = {
                "subject": f"Orden {order.order_number}",
                "amount": str(int(amount)),
                "currency": "CLP",
                "transaction_id": str(order.order_number),
                "return_url": return_url,
                "cancel_url": cancel_url,
                "picture_url": "",
                "custom": str(order.id),
                "body": "",
                "notify_url": kwargs.get('notify_url') or f"{settings.PAYMENT_WEBHOOK_URL}/payments/callback/Khipu/?tenant={order.tenant.slug}",
            }
            
            headers = {
                "Authorization": self._sign("POST", url, params)
            }
            
            response = requests.post(url, data=params, headers=headers, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Khipu Create error: {response.status_code} - {response.text}")
                raise PaymentGatewayError(f"Khipu API error: {response.text}", gateway='Khipu')
                
            result = response.json()
            return {
                'payment_url': result.get('payment_url'),
                'transaction_id': result.get('payment_id'),
                'token': result.get('payment_id'),
                'raw_response': result
            }
        except Exception as e:
            logger.error(f"Failed to create Khipu payment: {e}")
            raise PaymentGatewayError(str(e), gateway='Khipu')

    def verify_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify payment. Khipu sends notification_token in POST.
        We must query payment status using this token.
        """
        token = payment_data.get('notification_token')
        if not token:
            raise PaymentGatewayError("Missing notification_token in Khipu callback", gateway='Khipu')
            
        try:
            # First, check if the token is valid by querying it
            url = f"{self.base_url}/payments"
            params = {"notification_token": token}
            headers = {"Authorization": self._sign("GET", url, params)}
            
            response = requests.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Khipu Verify error: {response.status_code} - {response.text}")
                raise PaymentGatewayError(f"Khipu API error: {response.text}", gateway='Khipu')
                
            result = response.json()
            
            # Map Khipu status
            # Result is a Payment object. status can be 'done'
            is_done = result.get('status') == 'done'
            
            return {
                'status': 'completed' if is_done else 'pending',
                'transaction_id': result.get('payment_id'),
                'amount': Decimal(result.get('amount', 0)),
                'raw_response': result
            }
        except Exception as e:
            logger.error(f"Failed to verify Khipu payment: {e}")
            raise PaymentGatewayError(str(e), gateway='Khipu')

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            url = f"{self.base_url}/payments/{transaction_id}"
            headers = {"Authorization": self._sign("GET", url, {})}
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                return response.json()
            return {'error': response.text}
        except Exception as e:
            return {'error': str(e)}

    def validate_webhook_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        # Khipu uses notification_token to verify, not just a signature on the payload.
        return True
