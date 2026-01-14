"""
Payment models for handling transactions with payment gateways
"""
from django.db import models
from django.contrib.postgres.fields import ArrayField
import uuid


class PaymentGateway(models.TextChoices):
    """Available payment gateways"""
    FLOW = 'Flow', 'Flow'
    TRANSBANK = 'Transbank', 'Transbank WebPay Plus'
    MERCADOPAGO = 'MercadoPago', 'Mercado Pago'
    KHIPU = 'Khipu', 'Khipu'


class PaymentStatus(models.TextChoices):
    """Payment transaction statuses"""
    PENDING = 'Pending', 'Pending'
    PROCESSING = 'Processing', 'Processing'
    COMPLETED = 'Completed', 'Completed'
    FAILED = 'Failed', 'Failed'
    CANCELLED = 'Cancelled', 'Cancelled'
    REFUNDED = 'Refunded', 'Refunded'


class Payment(models.Model):
    """
    Payment transactions with external gateways.
    Stores complete transaction history and gateway responses.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payments')
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default='CLP')
    
    # Gateway transaction info
    gateway_transaction_id = models.CharField(max_length=255, blank=True, null=True)
    gateway_payment_url = models.TextField(blank=True, null=True)  # URL to redirect customer
    gateway_token = models.CharField(max_length=500, blank=True, null=True)  # Flow token
    gateway_response = models.JSONField(null=True, blank=True)  # Full gateway response
    
    # Error handling
    error_message = models.TextField(blank=True, null=True)
    retry_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'created_at']),
            models.Index(fields=['order']),
            models.Index(fields=['gateway_transaction_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.gateway} - {self.status}"
    
    @property
    def is_completed(self):
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def is_pending(self):
        return self.status == PaymentStatus.PENDING
    
    @property
    def can_retry(self):
        return self.status in [PaymentStatus.FAILED, PaymentStatus.CANCELLED] and self.retry_count < 3


class PaymentWebhookLog(models.Model):
    """
    Log all webhook/callback requests from payment gateways.
    Useful for debugging and audit trail.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE, related_name='payment_webhooks')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='webhook_logs', null=True, blank=True)
    
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    webhook_data = models.JSONField()  # Raw webhook payload
    headers = models.JSONField(null=True, blank=True)  # HTTP headers
    
    # Verification
    signature_valid = models.BooleanField(default=False)
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True, null=True)
    
    # Timestamps
    received_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payment_webhook_logs'
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['tenant', 'received_at']),
            models.Index(fields=['payment']),
            models.Index(fields=['processed']),
        ]
    
    def __str__(self):
        return f"Webhook {self.gateway} - {self.received_at}"
