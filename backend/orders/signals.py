
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Order, OrderStatus
from .email_service import send_order_confirmation_email, send_new_order_notification
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Order)
def store_previous_status(sender, instance, **kwargs):
    """
    Store the previous status to detect transitions
    """
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._previous_status = old_instance.status
        except Order.DoesNotExist:
            instance._previous_status = None
    else:
        instance._previous_status = None

@receiver(post_save, sender=Order)
def send_order_emails(sender, instance, created, **kwargs):
    """
    Trigger emails when order status changes to PAID
    """
    # Check if status changed to Paid
    # Note: 'Paid' string matches what was used in views.py, but models.py uses OrderStatus enum usually.
    # views.py used 'Paid' string literal. 
    # Let's check if it transitioned TO 'Paid' (or OrderStatus.PAID)
    
    current_status = instance.status
    previous_status = getattr(instance, '_previous_status', None)
    
    # Logic: If it wasn't Paid before, and it is Paid now.
    # Also handle 'created' if it's created directly as Paid (unlikely but possible)
    
    is_paid_now = current_status == 'Paid' or current_status == OrderStatus.PAID
    was_paid_before = previous_status == 'Paid' or previous_status == OrderStatus.PAID
    
    if is_paid_now and not was_paid_before:
        logger.info(f"Order {instance.order_number} transitioned to PAID. Sending emails.")
        try:
            send_order_confirmation_email(instance)
            send_new_order_notification(instance)
        except Exception as e:
            logger.error(f"Failed to send signals emails: {e}")
