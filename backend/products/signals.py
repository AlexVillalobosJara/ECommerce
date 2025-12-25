from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Product


@receiver(pre_save, sender=Product)
def set_published_at(sender, instance, **kwargs):
    """
    Automatically set published_at when product status changes to Published
    """
    # Only set published_at if:
    # 1. Status is Published
    # 2. published_at is not already set
    # 3. This is either a new product or status changed to Published
    if instance.status == 'Published' and not instance.published_at:
        # Check if this is an update (has pk) and status changed
        if instance.pk:
            try:
                old_instance = Product.objects.get(pk=instance.pk)
                # Only set if status changed from something else to Published
                if old_instance.status != 'Published':
                    instance.published_at = timezone.now()
            except Product.DoesNotExist:
                # New product being created as Published
                instance.published_at = timezone.now()
        else:
            # New product being created as Published
            instance.published_at = timezone.now()
