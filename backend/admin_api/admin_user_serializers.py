from django.contrib.auth.models import User
from rest_framework import serializers
from tenants.models import TenantUser, Tenant

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'role', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': True}
        }

    def create(self, validated_token):
        # This will be handled in the ViewSet to link with TenantUser
        pass

class TenantUserSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    tenant_name = serializers.ReadOnlyField(source='tenant.name')
    
    class Meta:
        model = TenantUser
        fields = ['id', 'user', 'role', 'tenant', 'tenant_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
