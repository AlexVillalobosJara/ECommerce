import logging
from decimal import Decimal
from .models import ShippingCarrierConfig, CarrierName

logger = logging.getLogger(__name__)

class ShippingService:
    @staticmethod
    def calculate_carrier_rates(tenant, destination_commune_name, weight_kg, subtotal):
        """
        Calculate rates from all active carriers for the tenant.
        Returns a list of dicts:
        {
            'carrier': 'Starken',
            'service': 'Normal',
            'cost': Decimal('5000'),
            'estimated_days': 3
        }
        """
        # Find active carriers
        configs = ShippingCarrierConfig.objects.filter(tenant=tenant, is_active=True)
        
        logger.info(f"ShippingService: Found {configs.count()} active carrier configs for tenant {tenant.slug}")
        rates = []
        
        for config in configs:
            try:
                logger.info(f"ShippingService: Calculating for {config.carrier_name}")
                if config.carrier_name == CarrierName.STARKEN:
                    rate = ShippingService._calculate_starken_rate(config, destination_commune_name, weight_kg)
                elif config.carrier_name == CarrierName.CHILEXPRESS:
                    rate = ShippingService._calculate_chilexpress_rate(config, destination_commune_name, weight_kg)
                elif config.carrier_name == CarrierName.BLUE_EXPRESS:
                    rate = ShippingService._calculate_blue_express_rate(config, destination_commune_name, weight_kg)
                else:
                    continue
                
                if rate:
                    logger.info(f"ShippingService: Rate found for {config.carrier_name}: {rate['cost']}")
                    rates.append(rate)
                else:
                    logger.warning(f"ShippingService: No rate returned for {config.carrier_name}")
            except Exception as e:
                logger.error(f"Error calculating rate for {config.carrier_name}: {e}")
        
        logger.info(f"ShippingService: Total rates found: {len(rates)}")
        return rates

    @staticmethod
    def _calculate_starken_rate(config, destination, weight):
        # TODO: Implement real Starken API
        # Mock logic based on weight
        base_cost = Decimal('4000')
        cost_per_kg = Decimal('800')
        cost = base_cost + (cost_per_kg * weight)
        
        return {
            'carrier': 'Starken',
            'service': 'Domicilio',
            'cost': cost,
            'estimated_days': 2
        }

    @staticmethod
    def _calculate_chilexpress_rate(config, destination, weight):
        from .carrier_adapters.chilexpress import ChilexpressAdapter
        
        adapter = ChilexpressAdapter(config)
        # Assuming origin is set in config or defaults to Santiago inside adapter
        # We pass destination Name
        return adapter.calculate_rate(origin=None, destination=destination, weight=weight)

    @staticmethod
    def _calculate_blue_express_rate(config, destination, weight):
        # TODO: Implement real BlueExpress API
        base_cost = Decimal('3500')
        cost_per_kg = Decimal('600')
        cost = base_cost + (cost_per_kg * weight)
        
        return {
            'carrier': 'BlueExpress',
            'service': 'Standard',
            'cost': cost,
            'estimated_days': 4
        }
