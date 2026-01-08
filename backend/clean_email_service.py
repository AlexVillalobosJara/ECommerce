#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to remove all non-ASCII characters from email_service.py
"""
import re

# Read the file
with open('orders/email_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace common Spanish characters and emojis
replacements = {
    # Emojis
    '🔔': '',
    '📄': '',
    '⏰': '',
    '📋': '',
    '💬': '',
    '💰': '',
    '✅': '',
    '👤': '',
    '📦': '',
    '🎉': '',
    '💳': '',
    '🔗': '',
    '📍': '',
    '📎': '',
    '🚚': '',
    # Spanish characters
    'á': 'a',
    'é': 'e',
    'í': 'i',
    'ó': 'o',
    'ú': 'u',
    'ñ': 'n',
    'Á': 'A',
    'É': 'E',
    'Í': 'I',
    'Ó': 'O',
    'Ú': 'U',
    'Ñ': 'N',
    '¿': '',
    '¡': '',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Write back
with open('orders/email_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Cleaned email_service.py successfully")
