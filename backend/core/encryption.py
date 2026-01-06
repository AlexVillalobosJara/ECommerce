"""
Encryption utilities for sensitive data
"""
from cryptography.fernet import Fernet
from django.conf import settings
import base64
import logging

logger = logging.getLogger(__name__)


def get_encryption_key():
    """Get or generate encryption key"""
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    
    if not key:
        # Generate a new key if not configured
        logger.warning("ENCRYPTION_KEY not configured, generating temporary key")
        key = Fernet.generate_key().decode()
    
    # Ensure key is bytes
    if isinstance(key, str):
        key = key.encode()
    
    return key


def encrypt_credential(value: str) -> str:
    """
    Encrypt sensitive credential.
    
    Args:
        value: Plain text credential
        
    Returns:
        Encrypted string (base64 encoded)
    """
    if not value:
        return ""
    
    try:
        f = Fernet(get_encryption_key())
        encrypted = f.encrypt(value.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        raise


def decrypt_credential(encrypted_value: str) -> str:
    """
    Decrypt credential.
    
    Args:
        encrypted_value: Encrypted credential string
        
    Returns:
        Decrypted plain text
    """
    if not encrypted_value:
        return ""
    
    try:
        f = Fernet(get_encryption_key())
        decrypted = f.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Decryption error: {e}")
        raise


def mask_credential(value: str, visible_chars: int = 4) -> str:
    """
    Mask credential for display purposes.
    Returns a string with a fixed prefix of stars followed by the last visible characters.
    
    Args:
        value: Credential to mask
        visible_chars: Number of characters to show at the end
        
    Returns:
        Masked string like "****************1234"
    """
    if not value or len(value) <= visible_chars:
        return "********"
    
    # Use a fixed number of stars (e.g., 20) to make it look uniform and recognizable
    return "*" * 20 + value[-visible_chars:]
