"""
Custom authentication class that disables CSRF for JWT-authenticated requests
"""
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuthenticationWithoutCSRF(JWTAuthentication):
    """
    JWT Authentication that doesn't enforce CSRF
    This is safe because JWT tokens in headers are not vulnerable to CSRF attacks
    """
    def enforce_csrf(self, request):
        """
        Override to skip CSRF check for JWT-authenticated requests
        """
        return  # Do nothing, effectively disabling CSRF for this auth method
