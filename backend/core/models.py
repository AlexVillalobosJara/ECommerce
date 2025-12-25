"""
Core models for shared data across the platform
"""
import uuid
from django.db import models


class Commune(models.Model):
    """
    Chilean communes catalog (346 communes)
    Used for shipping zones and address validation
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=10, unique=True, help_text="INE code")
    name = models.CharField(max_length=100)
    region_code = models.CharField(max_length=10)
    region_name = models.CharField(max_length=100)
    province = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'communes'
        ordering = ['region_code', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['region_code']),
        ]
    
    def __str__(self):
        return f"{self.name}, {self.region_name}"
