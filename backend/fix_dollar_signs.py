# -*- coding: utf-8 -*-
"""
Script to fix dollar sign syntax errors in f-strings
"""

# Read the file
with open('orders/email_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix lines with ${variable in f-strings
fixed_lines = []
for line in lines:
    # If line contains ${ followed by a variable name and formatting
    # Replace $ with $$ to escape it in f-strings
    if '${' in line and ('f"""' in line or 'f"' in line or (fixed_lines and ('f"""' in ''.join(fixed_lines[-10:]) or 'f"' in ''.join(fixed_lines[-10:])))):
        line = line.replace('${', '$${')
    fixed_lines.append(line)

# Write back
with open('orders/email_service.py', 'w', encoding='utf-8') as f:
    f.writelines(fixed_lines)

print("Fixed dollar sign syntax errors")
