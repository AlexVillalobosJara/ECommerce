from rest_framework import serializers
from tenants.models import Redirect

class RedirectSerializer(serializers.ModelSerializer):
    """Serializer for tenant redirects"""
    
    class Meta:
        model = Redirect
        fields = [
            'id',
            'old_path',
            'new_path',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_old_path(self, value):
        """Ensure path starts with /"""
        if not value.startswith('/'):
            raise serializers.ValidationError("Path must start with '/'")
        return value

    def validate_new_path(self, value):
        """Ensure path starts with / or is an absolute URL"""
        if not (value.startswith('/') or value.startswith('http')):
            raise serializers.ValidationError("Path must start with '/' or be a full URL (http/https)")
        return value

    def validate(self, data):
        """Cross-field validation for duplicates and infinite loops"""
        tenant = self.context['request'].tenant
        old_path = data.get('old_path')
        new_path = data.get('new_path')
        
        # Check if another redirect with the same old_path exists for this tenant
        queryset = Redirect.objects.filter(tenant=tenant, old_path=old_path)
        
        # If updating, exclude the current instance
        if self.instance:
            queryset = queryset.exclude(id=self.instance.id)
            
        if queryset.exists():
            raise serializers.ValidationError({
                "old_path": f"Ya existe una redirección para la ruta '{old_path}'."
            })

        # Prevent infinite loops
        if old_path == new_path:
            raise serializers.ValidationError({
                "new_path": "La ruta de destino no puede ser igual a la ruta de origen."
            })
            
        return data
