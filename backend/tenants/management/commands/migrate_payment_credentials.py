"""
Migration script to move payment credentials from Tenant model to PaymentGatewayConfig model
Run this after creating the payment_gateway_configs table
"""
from django.core.management.base import BaseCommand
from tenants.models import Tenant
from tenants.payment_config_models import PaymentGatewayConfig


class Command(BaseCommand):
    help = 'Migrate payment credentials from Tenant to PaymentGatewayConfig'

    def handle(self, *args, **options):
        self.stdout.write('Starting migration of payment credentials...')
        
        migrated_count = 0
        
        for tenant in Tenant.objects.filter(deleted_at__isnull=True):
            self.stdout.write(f'\nProcessing tenant: {tenant.name} ({tenant.slug})')
            
            # Migrate Transbank credentials
            if tenant.transbank_api_key or tenant.transbank_commerce_code:
                config, created = PaymentGatewayConfig.objects.get_or_create(
                    tenant=tenant,
                    gateway='Transbank'
                )
                
                if tenant.transbank_api_key:
                    config.api_key = tenant.transbank_api_key
                if tenant.transbank_commerce_code:
                    config.commerce_code = tenant.transbank_commerce_code
                
                config.is_sandbox = True  # Default to sandbox
                config.is_active = False  # Require manual activation
                config.save()
                
                self.stdout.write(f'  ✓ Migrated Transbank credentials')
                migrated_count += 1
            
            # Migrate Mercado Pago credentials
            if tenant.mercadopago_access_token or tenant.mercadopago_public_key:
                config, created = PaymentGatewayConfig.objects.get_or_create(
                    tenant=tenant,
                    gateway='MercadoPago'
                )
                
                if tenant.mercadopago_access_token:
                    config.api_key = tenant.mercadopago_access_token
                if tenant.mercadopago_public_key:
                    config.public_key = tenant.mercadopago_public_key
                
                config.is_sandbox = True
                config.is_active = False
                config.save()
                
                self.stdout.write(f'  ✓ Migrated Mercado Pago credentials')
                migrated_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'\n✓ Migration complete! Migrated {migrated_count} gateway configurations.'))
        self.stdout.write(self.style.WARNING('\nNOTE: All gateways are set to inactive. Activate them in the admin panel.'))
