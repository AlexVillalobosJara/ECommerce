import logging
import requests
import json
from decimal import Decimal
from .base import BaseCarrierAdapter

logger = logging.getLogger(__name__)

class StarkenAdapter(BaseCarrierAdapter):
    # Base URL placeholder
    BASE_URL = "https://api.starken.cl/v1/" # Generic placeholder

    def calculate_rate(self, origin, destination, weight, height=10, width=10, length=10, declared_value=1000):
        """
        Calculate rates using Starken API.
        Top be implemented with real docs.
        """
        api_key = self.config.api_key
        
        logger.info(f"Starken: Calculating rate for {origin} -> {destination}")

        if not api_key:
            logger.warning("Starken: Missing API Key")
            return None
            
        # TODO: Implement Real API Call
        # usually requires JWT token or specific headers
        
        return None
