
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
    Trigger emails when order status changes
    """
    from .email_service import (
        send_order_confirmation_email, 
        send_new_order_notification,
        send_order_status_update_email
    )
    
    current_status = instance.status
    previous_status = getattr(instance, '_previous_status', None)
    
    # Avoid duplicate emails if status hasn't changed
    if not created and current_status == previous_status:
        return

    # 1. Handle PAID status (New Sale)
    is_paid_now = current_status == 'Paid' or current_status == OrderStatus.PAID
    was_paid_before = previous_status == 'Paid' or previous_status == OrderStatus.PAID
    
    if is_paid_now and (created or not was_paid_before):
        logger.info(f"Order {instance.order_number} is PAID. Sending confirmation emails.")
        try:
            send_order_confirmation_email(instance)
            send_new_order_notification(instance)
        except Exception as e:
            logger.error(f"Failed to send paid confirmation emails: {e}")
        return # Confirmation email is enough for this transition

    # 2. Handle Status Updates
    # Supported statuses for notifications:
    notify_statuses = [
        'QuoteSent', 
        'Processing', 
        'Shipped', 
        'Delivered', 
        'Cancelled', 
        'Refunded'
    ]
    
    # Check if we transitioned TO one of these statuses
    if current_status in notify_statuses:
        # For QuoteSent, we always notify even if it was QuoteSent before (e.g. re-sending updated quote)
        # For others, only if it changed
        should_send = (current_status == 'QuoteSent') or (current_status != previous_status)
        
        if should_send:
            logger.info(f"Order {instance.order_number} transitioned to {current_status}. Sending update email.")
            try:
                send_order_status_update_email(instance)
            except Exception as e:
                logger.error(f"Failed to send status update email for {current_status}: {e}")
