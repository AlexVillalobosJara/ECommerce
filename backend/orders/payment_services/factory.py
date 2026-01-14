"""
Payment service factory to select the appropriate gateway
"""
from .base import PaymentGatewayService, PaymentGatewayError
from .flow_service import FlowService
from .transbank_service import TransbankService
from .khipu_service import KhipuService


class PaymentServiceFactory:
    """
    Factory to create payment gateway service instances.
    """
    
    _services = {
        'Flow': FlowService,
        'Transbank': TransbankService,
        'Khipu': KhipuService,
    }
    
    @classmethod
    def get_service(cls, gateway: str, tenant=None) -> PaymentGatewayService:
        """
        Get payment service instance for specified gateway.
        
        Args:
            gateway: Gateway name (e.g., 'Flow', 'Transbank')
            tenant: Tenant instance (optional) for tenant-specific credentials
            
        Returns:
            PaymentGatewayService instance
            
        Raises:
            PaymentGatewayError: If gateway is not supported
        """
        service_class = cls._services.get(gateway)
        
        if not service_class:
            raise PaymentGatewayError(
                f'Unsupported payment gateway: {gateway}',
                gateway=gateway
            )
        
        # Initialize service with tenant (if provided)
        return service_class(tenant=tenant)
    
    @classmethod
    def get_available_gateways(cls) -> list:
        """
        Get list of available payment gateways.
        
        Returns:
            List of gateway names
        """
        return list(cls._services.keys())
