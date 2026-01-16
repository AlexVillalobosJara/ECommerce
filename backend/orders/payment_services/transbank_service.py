"""
Transbank Webpay Plus payment gateway service implementation
https://www.transbankdevelopers.cl/referencia/webpay?l=python#crear-una-transaccion
"""
import requests
import json
import logging
from typing import Dict, Any
from decimal import Decimal
from django.conf import settings
from .base import PaymentGatewayService, PaymentGatewayError

logger = logging.getLogger(__name__)


class TransbankService(PaymentGatewayService):
    """
    Transbank Webpay Plus integration.
    """
    
    def __init__(self, tenant=None):
        """
        Initialize Transbank service.
        """
        if tenant:
            try:
                from tenants.payment_config_models import PaymentGatewayConfig
                config = PaymentGatewayConfig.objects.filter(
                    tenant=tenant,
                    gateway='Transbank'
                    # Allow loading inactive configs (e.g. for certification/setup)
                ).first()
                
                if config:
                    self.api_key = config.api_key
                    self.commerce_code = config.commerce_code
                    self.is_sandbox = config.is_sandbox
                    logger.info(f'Using Transbank credentials for tenant: {tenant.slug}')
                else:
                    self._load_global_settings()
            except Exception as e:
                logger.error(f'Error loading tenant Transbank config: {e}')
                self._load_global_settings()
        else:
            self._load_global_settings()
            
        # Set API URL
        if self.is_sandbox:
            self.base_url = 'https://webpay3gint.transbank.cl'
            # Default sandbox credentials if none provided
            if not self.api_key or not self.commerce_code:
                self.api_key = '597055555532' # API Key is actually used as Header 'Tbk-Api-Key'
                self.commerce_code = '597055555532'
                # Note: For sandbox, commerce_code and api_key are the same usually or use specific ones
                # Integracion normal: 597055555532 / Tbk-Api-Key: 579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C
                self.api_key = '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C'
        else:
            self.base_url = 'https://webpay3g.transbank.cl'

    def _load_global_settings(self):
        try:
            config = settings.PAYMENT_GATEWAYS.get('TRANSBANK', {})
            self.api_key = config.get('API_KEY', '')
            self.commerce_code = config.get('COMMERCE_CODE', '')
            self.is_sandbox = config.get('ENVIRONMENT', 'sandbox') == 'sandbox'
        except Exception:
            self.api_key = ''
            self.commerce_code = ''
            self.is_sandbox = True

    def _get_headers(self):
        return {
            'Tbk-Api-Key-Id': self.commerce_code,
            'Tbk-Api-Key-Secret': self.api_key,
            'Content-Type': 'application/json'
        }

    def create_payment(
        self,
        order,
        amount: Decimal,
        return_url: str,
        cancel_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a transaction in Webpay Plus.
        """
        try:
            payload = {
                "buy_order": str(order.order_number),
                "session_id": str(order.id),
                "amount": int(amount),
                "return_url": return_url
            }
            
            response = requests.post(
                f"{self.base_url}/rswebpaytransaction/api/webpay/v1.2/transactions",
                headers=self._get_headers(),
                data=json.dumps(payload),
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Transbank Create error: {response.status_code} - {response.text}")
                raise PaymentGatewayError(f"Transbank API error: {response.text}", gateway='Transbank')
                
            result = response.json()
            return {
                'payment_url': f"{result['url']}?token_ws={result['token']}",
                'transaction_id': result['token'],
                'token': result['token'],
                'raw_response': result
            }
        except Exception as e:
            logger.error(f"Failed to create Transbank payment: {e}")
            raise PaymentGatewayError(str(e), gateway='Transbank')

    def verify_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Confirm/Commit the transaction.
        """
        token = payment_data.get('token_ws')
        if not token:
            # Check if it was a cancellation (token_ws missing but TBK_TOKEN present?)
            # Actually Webpay sends TBK_TOKEN when cancelled.
            tbk_token = payment_data.get('TBK_TOKEN')
            if tbk_token:
                return {'status': 'cancelled', 'transaction_id': tbk_token}
            raise PaymentGatewayError("Missing token_ws in Transbank callback", gateway='Transbank')
            
        try:
            response = requests.put(
                f"{self.base_url}/rswebpaytransaction/api/webpay/v1.2/transactions/{token}",
                headers=self._get_headers(),
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Transbank Commit error: {response.status_code} - {response.text}")
                # Possibly aborted or already committed
                return {'status': 'failed', 'error': response.text}
                
            result = response.json()
            
            # response_code 0 is success
            if result.get('response_code') == 0:
                return {
                    'status': 'completed',
                    'transaction_id': result.get('buy_order'),
                    'amount': Decimal(result.get('amount', 0)),
                    'payment_date': result.get('transaction_date'),
                    'raw_response': result
                }
            else:
                return {
                    'status': 'failed',
                    'transaction_id': result.get('buy_order'),
                    'raw_response': result
                }
        except Exception as e:
            logger.error(f"Failed to verify Transbank payment: {e}")
            raise PaymentGatewayError(str(e), gateway='Transbank')

    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        try:
            response = requests.get(
                f"{self.base_url}/rswebpaytransaction/api/webpay/v1.2/transactions/{transaction_id}",
                headers=self._get_headers(),
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()
                return result
            return {'error': response.text}
        except Exception as e:
            return {'error': str(e)}

    def validate_webhook_signature(self, payload: Dict[str, Any], signature: str) -> bool:
        # Transbank REST uses HTTPS and tokens, doesn't use shared secret signatures like Flow for webhooks in the same way.
        return True
