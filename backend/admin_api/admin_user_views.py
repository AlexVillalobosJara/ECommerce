from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404
from tenants.models import TenantUser, Tenant
from .admin_user_serializers import TenantUserSerializer, UserSerializer

class IsTenantAdmin(permissions.BasePermission):
    """
    Permission for Tenant Admin: Full access to THEIR tenant data.
    Denies access to Operators if they try to create/update users.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superuser always has access
        if request.user.is_superuser:
            return True
            
        # Check tenant context
        if not hasattr(request, 'tenant') or not request.tenant:
            return False
            
        # Look for the user's role in this tenant
        try:
            tenant_user = TenantUser.objects.get(user=request.user, tenant=request.tenant)
            # Both Owners and Admins are "Admins" for functional purposes here
            if tenant_user.role in ['Owner', 'Admin']:
                return True
        except TenantUser.DoesNotExist:
            return False
            
        # For data viewing (GET), allow Operators, but handle specifically in the view if needed
        if request.method in permissions.SAFE_METHODS:
            return True
            
        return False

class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = TenantUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantAdmin]

    def get_queryset(self):
        user = self.request.user
        tenant = getattr(self.request, 'tenant', None)

        if user.is_superuser:
            # Superuser can see ALL users from all tenants (or filter by tenant if provided)
            # If a tenant is in context, filter by it
            if tenant:
                return TenantUser.objects.filter(tenant=tenant)
            return TenantUser.objects.all()

        if not tenant:
            return TenantUser.objects.none()

        # Admin and Operator can only see users of their own tenant
        # SECURITY: Hide superusers from standard admins/operators
        return TenantUser.objects.filter(
            tenant=tenant
        ).exclude(user__is_superuser=True)

    def create(self, request, *args, **kwargs):
        user_data = request.data.get('user', {})
        role = request.data.get('role', 'Operator')
        is_active = request.data.get('is_active', True)
        tenant_id = request.data.get('tenant')
        
        requesting_user = request.user
        current_tenant = getattr(request, 'tenant', None)

        # Permission Check: Operator cannot create users
        if not requesting_user.is_superuser:
            try:
                requester_link = TenantUser.objects.get(user=requesting_user, tenant=current_tenant)
                if requester_link.role == 'Operator':
                    return Response({"detail": "Los operadores no tienen permiso para crear usuarios."}, status=status.HTTP_403_FORBIDDEN)
            except TenantUser.DoesNotExist:
                return Response({"detail": "Sin acceso al tenant."}, status=status.HTTP_403_FORBIDDEN)

        # Tenant target determination
        target_tenant = None
        if requesting_user.is_superuser and tenant_id:
            target_tenant = get_object_or_404(Tenant, id=tenant_id)
        elif current_tenant:
            target_tenant = current_tenant
        else:
            return Response({"detail": "Debe especificar un tenant."}, status=status.HTTP_400_BAD_REQUEST)

        # Role restriction for non-superusers
        if not requesting_user.is_superuser:
            # An Admin cannot create an Owner
            if role == 'Owner':
                return Response({"detail": "No puede crear un usuario Propietario."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            # Create the Django User
            # First check if user already exists
            username = user_data.get('username')
            email = user_data.get('email')
            
            if not username or not email:
                return Response({"detail": "Username y Email son obligatorios."}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                return Response({"detail": f"El nombre de usuario '{username}' ya existe."}, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists():
                return Response({"detail": f"El correo electrónico '{email}' ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)
            
            django_user = User.objects.create_user(
                username=username,
                email=email,
                password=user_data.get('password'),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', '')
            )
            
            # Create the TenantUser link
            tenant_user = TenantUser.objects.create(
                user=django_user,
                tenant=target_tenant,
                role=role,
                is_active=is_active
            )
            
            serializer = self.get_serializer(tenant_user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Refine updates: Prevent role escalation, system user modification,
        and handle nested User update manually to avoid validation conflicts.
        """
        instance = self.get_object()
        requesting_user = request.user
        
        # 1. Non-superusers cannot modify superusers
        if not requesting_user.is_superuser and instance.user.is_superuser:
            return Response({"detail": "No puede modificar un usuario de sistema."}, status=status.HTTP_403_FORBIDDEN)
            
        # 2. Prevent role escalation to Owner if not superuser
        new_role = request.data.get('role')
        if new_role == 'Owner' and not requesting_user.is_superuser:
             return Response({"detail": "No tiene permiso para asignar el rol de Propietario."}, status=status.HTTP_403_FORBIDDEN)

        user_data = request.data.get('user', {})
        role = request.data.get('role')
        is_active = request.data.get('is_active')

        with transaction.atomic():
            # Update the Django User manually to avoid UniqueValidator conflict on same username/email
            django_user = instance.user
            
            if 'username' in user_data:
                new_username = user_data['username']
                if new_username != django_user.username and User.objects.filter(username=new_username).exists():
                    return Response({"detail": f"El nombre de usuario '{new_username}' ya existe."}, status=status.HTTP_400_BAD_REQUEST)
                django_user.username = new_username
                
            if 'email' in user_data:
                new_email = user_data['email']
                if new_email != django_user.email and User.objects.filter(email=new_email).exists():
                    return Response({"detail": f"El correo electrónico '{new_email}' ya está registrado."}, status=status.HTTP_400_BAD_REQUEST)
                django_user.email = new_email

            if 'first_name' in user_data:
                django_user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                django_user.last_name = user_data['last_name']
            
            if 'password' in user_data and user_data['password']:
                django_user.set_password(user_data['password'])
            
            django_user.save()

            # Update TenantUser fields
            if role:
                instance.role = role
            if is_active is not None:
                instance.is_active = is_active
            
            instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Refine deletion: Prevent deleting superusers.
        """
        instance = self.get_object()
        if instance.user.is_superuser and not request.user.is_superuser:
            return Response({"detail": "No puede eliminar un usuario de sistema."}, status=status.HTTP_403_FORBIDDEN)
            
        return super().destroy(request, *args, **kwargs)
