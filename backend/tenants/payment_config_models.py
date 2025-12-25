"""
Payment gateway configuration models for multi-tenant support
"""
from django.db import models
import uuid
from orders.payment_models import PaymentGateway
from core.encryption import encrypt_credential, decrypt_credential, mask_credential


class PaymentGatewayConfig(models.Model):
    """
    Payment gateway configuration per tenant.
    Stores encrypted credentials for each payment gateway.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payment_configs')
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    
    # Status
    is_active = models.BooleanField(default=False)
    is_sandbox = models.BooleanField(default=True)
    
    # Encrypted credentials (stored as encrypted strings)
    api_key_encrypted = models.TextField(blank=True)
    secret_key_encrypted = models.TextField(blank=True)
    commerce_code_encrypted = models.TextField(blank=True)  # For Transbank
    public_key_encrypted = models.TextField(blank=True)  # For Mercado Pago
    
    # Additional configuration (JSON for flexibility)
    config_data = models.JSONField(default=dict, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.UUIDField(null=True, blank=True)
    updated_by = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_gateway_configs'
        unique_together = [['tenant', 'gateway']]
        ordering = ['gateway']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['gateway']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.gateway} ({'Active' if self.is_active else 'Inactive'})"
    
    # Property methods for encrypted fields
    @property
    def api_key(self):
        """Get decrypted API key"""
        if self.api_key_encrypted:
            return decrypt_credential(self.api_key_encrypted)
        return ""
    
    @api_key.setter
    def api_key(self, value):
        """Set and encrypt API key"""
        if value:
            self.api_key_encrypted = encrypt_credential(value)
        else:
            self.api_key_encrypted = ""
    
    @property
    def secret_key(self):
        """Get decrypted secret key"""
        if self.secret_key_encrypted:
            return decrypt_credential(self.secret_key_encrypted)
        return ""
    
    @secret_key.setter
    def secret_key(self, value):
        """Set and encrypt secret key"""
        if value:
            self.secret_key_encrypted = encrypt_credential(value)
        else:
            self.secret_key_encrypted = ""
    
    @property
    def commerce_code(self):
        """Get decrypted commerce code"""
        if self.commerce_code_encrypted:
            return decrypt_credential(self.commerce_code_encrypted)
        return ""
    
    @commerce_code.setter
    def commerce_code(self, value):
        """Set and encrypt commerce code"""
        if value:
            self.commerce_code_encrypted = encrypt_credential(value)
        else:
            self.commerce_code_encrypted = ""
    
    @property
    def public_key(self):
        """Get decrypted public key"""
        if self.public_key_encrypted:
            return decrypt_credential(self.public_key_encrypted)
        return ""
    
    @public_key.setter
    def public_key(self, value):
        """Set and encrypt public key"""
        if value:
            self.public_key_encrypted = encrypt_credential(value)
        else:
            self.public_key_encrypted = ""
    
    def get_masked_credentials(self):
        """Get masked credentials for display"""
        return {
            'api_key': mask_credential(self.api_key) if self.api_key else None,
            'secret_key': mask_credential(self.secret_key) if self.secret_key else None,
            'commerce_code': mask_credential(self.commerce_code) if self.commerce_code else None,
            'public_key': mask_credential(self.public_key) if self.public_key else None,
        }
    
    def to_dict(self, include_credentials=False):
        """Convert to dictionary for API responses"""
        data = {
            'id': str(self.id),
            'gateway': self.gateway,
            'is_active': self.is_active,
            'is_sandbox': self.is_sandbox,
            'config_data': self.config_data,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }
        
        if include_credentials:
            # Only include masked credentials
            data['credentials'] = self.get_masked_credentials()
        
        return data
