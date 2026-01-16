from rest_framework import serializers
from tenants.models import Tenant, TenantUser
from tenants.marketing_config_models import TenantMarketingConfig
from tenants.payment_config_models import PaymentGatewayConfig
from orders.payment_models import PaymentGateway
from django.contrib.auth.models import User
from django.db import transaction

class AdminTenantSerializer(serializers.ModelSerializer):
    # Owner creation fields
    owner_username = serializers.CharField(write_only=True, required=False)
    owner_email = serializers.EmailField(write_only=True, required=False)
    owner_password = serializers.CharField(write_only=True, required=False)
    owner_name = serializers.CharField(write_only=True, required=False)
    owner_last_name = serializers.CharField(write_only=True, required=False)
    
    # Read-only info
    owner_info = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'deleted_at']

    def get_owner_info(self, obj):
        owner_link = TenantUser.objects.filter(tenant=obj, role='Owner').first()
        if owner_link:
            return {
                'username': owner_link.user.username,
                'email': owner_link.user.email,
                'first_name': owner_link.user.first_name,
                'last_name': owner_link.user.last_name,
            }
        return None

    def create(self, validated_data):
        owner_username = validated_data.pop('owner_username', None)
        owner_email = validated_data.pop('owner_email', None)
        owner_password = validated_data.pop('owner_password', None)
        owner_name = validated_data.pop('owner_name', '')
        owner_last_name = validated_data.pop('owner_last_name', '')

        with transaction.atomic():
            # 1. Create Tenant
            # Ensure slug is lowercase
            if 'slug' in validated_data:
                validated_data['slug'] = validated_data['slug'].lower()
                
            tenant = Tenant.objects.create(**validated_data)
            
            # 2. Create Owner User
            if owner_username and owner_email and owner_password:
                if User.objects.filter(username=owner_username).exists():
                    raise serializers.ValidationError({"owner_username": "Este nombre de usuario ya existe."})
                if User.objects.filter(email=owner_email).exists():
                    raise serializers.ValidationError({"owner_email": "Este correo ya está registrado."})
                
                user = User.objects.create_user(
                    username=owner_username,
                    email=owner_email,
                    password=owner_password,
                    first_name=owner_name,
                    last_name=owner_last_name
                )
                
                # 3. Link Owner to Tenant
                TenantUser.objects.create(
                    tenant=tenant,
                    user=user,
                    role='Owner',
                    is_active=True
                )
            
            # 4. Initialize Marketing Config
            TenantMarketingConfig.objects.get_or_create(tenant=tenant)
            
            # 5. Initialize basic Payment Gateway Configs (Transbank and MercadoPago as default)
            PaymentGatewayConfig.objects.get_or_create(
                tenant=tenant, 
                gateway=PaymentGateway.TRANSBANK,
                defaults={'is_active': False, 'is_sandbox': True}
            )
            PaymentGatewayConfig.objects.get_or_create(
                tenant=tenant, 
                gateway=PaymentGateway.MERCADOPAGO,
                defaults={'is_active': False, 'is_sandbox': True}
            )
            
            return tenant
