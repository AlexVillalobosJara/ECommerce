from rest_framework import serializers
from .models import Order, OrderItem


class QuoteResponseSerializer(serializers.Serializer):
    """Serializer for responding to quote requests"""
    quote_items = serializers.DictField(
        child=serializers.DecimalField(max_digits=18, decimal_places=2)
    )
    quote_valid_until = serializers.DateField()
    internal_notes = serializers.CharField(required=False, allow_blank=True)


class PaymentConfirmationSerializer(serializers.Serializer):
    """Serializer for confirming payment"""
    payment_method = serializers.ChoiceField(
        choices=['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash']
    )
    transaction_id = serializers.CharField(max_length=200, required=False)
    payment_notes = serializers.CharField(required=False, allow_blank=True)
