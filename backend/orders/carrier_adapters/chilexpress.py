import requests
import json
import logging
from decimal import Decimal
from .base import BaseCarrierAdapter

logger = logging.getLogger(__name__)
# DEBUG: File Handler
try:
    fh = logging.FileHandler('chilexpress_debug.log')
    fh.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    fh.setFormatter(formatter)
    logger.addHandler(fh)
except Exception:
    pass


class ChilexpressAdapter(BaseCarrierAdapter):
    # URLs
    RATING_URL_TEST = "https://testservices.wschilexpress.com/rating/api/v1.0/rates/courier"
    RATING_URL_PROD = "https://services.wschilexpress.com/rating/api/v1.0/rates/courier"
    
    COVERAGE_URL_TEST = "https://testservices.wschilexpress.com/georeference/api/v1.0/coverages"
    COVERAGE_URL_PROD = "https://services.wschilexpress.com/georeference/api/v1.0/coverages"
    
    _coverage_cache = {}

    def __init__(self, config):
        super().__init__(config)
        self.is_test = config.extra_settings.get('is_test_mode', True)
        
    @property
    def rating_url(self):
        return self.RATING_URL_TEST if self.is_test else self.RATING_URL_PROD

    @property
    def coverage_url(self):
        return self.COVERAGE_URL_TEST if self.is_test else self.COVERAGE_URL_PROD

    def get_county_code(self, commune_name):
        """
        Resolve a commune name to a Chilexpress County Code (e.g., 'PROV').
        Uses in-memory cache to avoid repeated API calls.
        """
        if not commune_name:
            return None
            
        normalized_name = self.normalize_commune(commune_name)
        
        # Check cache first
        if not self._coverage_cache:
            self._load_coverage_cache()
            
        # Try exact match
        code = self._coverage_cache.get(normalized_name)
        if code:
            return code
            
        # Try partial match (e.g. "SANTIAGO CENTRO" vs "SANTIAGO")
        for name, c in self._coverage_cache.items():
            if normalized_name in name or name in normalized_name:
                return c
                
        # Internal hardcoded fallback for common test cases if API fails or cache empty
        FALLBACK_CODES = {
            "SANTIAGO": "STGO",
            "SANTIAGO CENTRO": "STGO",
            "PROVIDENCIA": "PROV",
            "LAS CONDES": "LCON",
            "VITACURA": "VITA",
            "NUÑOA": "NUN",
            "ÑUÑOA": "NUN",
            "PUDAHUEL": "PUDA",
            "MAIPU": "MAIP",
            "BUIN": "BUIN",
            "VALPARAISO": "VALP",
            "VALPARAÍSO": "VALP",
            "VINA DEL MAR": "VINA",
            "VIÑA DEL MAR": "VINA"
        }
        return FALLBACK_CODES.get(normalized_name)

    def _load_coverage_cache(self):
        """
        Fetch all coverages from Chilexpress API and populate the cache.
        """
        api_key = self.config.api_key
        headers = {
            'Ocp-Apim-Subscription-Key': api_key
        }
        
        try:
            logger.info(f"Chilexpress: Loading coverage cache ({'TEST' if self.is_test else 'PROD'})...")
            
            # In PRODUCTION, fetching without params returns the full list efficiently.
            # In TEST, we iterate regions to avoid 404s/Limits.
            
            if self.is_test:
                 regions = ['RM', 'V', '5', '05']
                 for region in regions:
                    self._fetch_region_coverage(region, headers)
            else:
                # Production: Fetch ALL
                self._fetch_region_coverage(None, headers)
                
            logger.info(f"Chilexpress: Total cached {len(self._coverage_cache)} communes.")
                
        except Exception as e:
            logger.error(f"Chilexpress Coverage Exception: {e}")

    def _fetch_region_coverage(self, region_code, headers):
        try:
            url = self.coverage_url
            if region_code:
                url += f"?RegionCode={region_code}"
                
            response = requests.get(url, headers=headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                coverages = data.get('coverages', [])
                for cov in coverages:
                    name = self.normalize_commune(cov.get('countyName'))
                    code = cov.get('countyCode')
                    if name and code:
                        self._coverage_cache[name] = code
            else:
                 logger.warning(f"Chilexpress Coverage Error ({url}): {response.status_code}")
        except Exception as e:
            logger.warning(f"Error fetching specific coverage: {e}")

    def calculate_rate(self, origin, destination, weight, height=10, width=10, length=10, declared_value=1000):
        """
        Calculate rates using Chilexpress API.
        """
        api_key = self.config.api_key
        tcc = self.config.account_number 

        if not api_key:
            logger.warning("Chilexpress: Missing API Key.")
            return None

        # Default origin if not provided
        if not origin:
            # Try to get from extra_settings or default to Santiago
            origin = self.config.extra_settings.get('origin_commune', 'SANTIAGO')

        # Resolve Codes
        origin_code = self.get_county_code(origin)
        dest_code = self.get_county_code(destination)
        
        if not origin_code: origin_code = "STGO" 
        if not dest_code:
            logger.warning(f"Chilexpress: Could not resolve code for destination '{destination}'")
            # If fail, try to pass the name as fallback if API allows it or we are desperate
            # But usually it will fail with 400.
            return None

        payload = {
            "originCountyCode": origin_code,
            "destinationCountyCode": dest_code,
            "package": {
                "weight": str(weight),
                "height": str(height),
                "width": str(width),
                "length": str(length)
            },
            "productType": 3, 
            "contentType": 1, 
            "declaredWorth": str(declared_value),
            "deliveryTime": 0
        }
        
        if tcc:
            payload["customerCardNumber"] = tcc

        headers = {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': api_key
        }

        try:
            logger.info(f"Chilexpress Request URL: {self.rating_url}")
            logger.info(f"Chilexpress Payload: {json.dumps(payload)}")
            
            response = requests.post(self.rating_url, json=payload, headers=headers, timeout=10)
            
            logger.info(f"Chilexpress Response Status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Chilexpress Error Body: {response.text}")
                return None
            
            data = response.json()
            
            if not data.get('data') or not data['data'].get('courierServiceOptions'):
                 logger.warning(f"Chilexpress: No services returned for {origin_code}->{dest_code}")
                 return None

            # Get the cheapest option
            options = data['data']['courierServiceOptions']
            best_option = min(options, key=lambda x: x.get('serviceValue', 999999))
            
            cost = Decimal(str(best_option.get('serviceValue', 0)))
            service_name = best_option.get('serviceDescription', 'Standard')
            
            # Simple estimation mapping
            estimated_days = 1 # Default
            if 'Subsiguiente' in service_name:
                estimated_days = 2
            elif 'Tercer' in service_name:
                estimated_days = 3

            return {
                'carrier': 'Chilexpress',
                'service': service_name,
                'cost': cost,
                'estimated_days': estimated_days
            }

        except Exception as e:
            logger.error(f"Chilexpress Exception: {e}")
            return None


    def normalize_commune(self, name):
        """
        Normalize commune names to match Chilexpress expectations.
        """
        if not name: return ""
        return name.strip().upper()
