from abc import ABC, abstractmethod
from decimal import Decimal

class BaseCarrierAdapter(ABC):
    def __init__(self, config):
        """
        Initialize with a ShippingCarrierConfig instance.
        """
        self.config = config

    @abstractmethod
    def calculate_rate(self, origin, destination, weight, height=10, width=10, length=10, declared_value=1000):
        """
        Calculate shipping rate.
        
        Args:
            origin (str): Origin commune name.
            destination (str): Destination commune name.
            weight (Decimal): Weight in Kg.
            height (int): Height in cm.
            width (int): Width in cm.
            length (int): Length in cm.
            declared_value (int): Declared value of the package in CLP.
            
        Returns:
            dict: {
                'carrier': str,
                'service': str,
                'cost': Decimal,
                'estimated_days': int (optional)
            } or None if no rate found/error.
        """
        pass
