"""
Base abstract class for payment gateway services
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from decimal import Decimal


class PaymentGatewayService(ABC):
    """
    Abstract base class for payment gateway integrations.
    All payment gateway services must implement these methods.
    """
    
    @abstractmethod
    def create_payment(
        self,
        order,
        amount: Decimal,
        return_url: str,
        cancel_url: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a payment transaction with the gateway.
        
        Args:
            order: Order instance
            amount: Payment amount
            return_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
            **kwargs: Additional gateway-specific parameters
            
        Returns:
            Dict containing:
                - payment_url: URL to redirect customer
                - transaction_id: Gateway transaction ID
                - token: Payment token (if applicable)
                - additional gateway-specific data
                
        Raises:
            PaymentGatewayError: If payment creation fails
        """
        pass
    
    @abstractmethod
    def verify_payment(self, payment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify payment status from webhook/callback data.
        
        Args:
            payment_data: Data received from gateway webhook/callback
            
        Returns:
            Dict containing:
                - status: Payment status (completed, failed, pending, etc.)
                - transaction_id: Gateway transaction ID
                - amount: Payment amount
                - additional verification data
                
        Raises:
            PaymentGatewayError: If verification fails
        """
        pass
    
    @abstractmethod
    def get_payment_status(self, transaction_id: str) -> Dict[str, Any]:
        """
        Query payment status from gateway.
        
        Args:
            transaction_id: Gateway transaction ID
            
        Returns:
            Dict containing current payment status and details
            
        Raises:
            PaymentGatewayError: If status query fails
        """
        pass
    
    @abstractmethod
    def validate_webhook_signature(
        self,
        payload: Dict[str, Any],
        signature: str
    ) -> bool:
        """
        Validate webhook signature to ensure request is from gateway.
        
        Args:
            payload: Webhook payload
            signature: Signature from webhook headers
            
        Returns:
            True if signature is valid, False otherwise
        """
        pass


class PaymentGatewayError(Exception):
    """Base exception for payment gateway errors"""
    
    def __init__(self, message: str, gateway: str = None, details: Dict = None):
        self.message = message
        self.gateway = gateway
        self.details = details or {}
        super().__init__(self.message)
    
    def __str__(self):
        if self.gateway:
            return f"[{self.gateway}] {self.message}"
        return self.message
