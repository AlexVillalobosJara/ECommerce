# -*- coding: utf-8 -*-
"""
Comprehensive script to find and fix ALL f-string dollar sign issues
"""
import re

# Read the file
with open('orders/email_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all occurrences of ${variable:format} pattern
pattern = r'\$\{([^}]+):,\.0f\}'
matches = re.findall(pattern, content)

print(f"Found {len(matches)} occurrences of ${...format} pattern:")
for match in matches:
    print(f"  - ${{{match}:,.0f}}")

# Strategy: We need to find these patterns within f-strings and fix them
# The issue is that ${variable:,.0f} inside an f-string is invalid syntax

# Let's do a more targeted replacement
# We'll look for lines that have this pattern and are part of f-strings

lines = content.split('\n')
fixed_lines = []
in_fstring = False
fstring_indent = 0

for i, line in enumerate(lines):
    # Check if we're starting an f-string
    if 'f"""' in line or 'f"' in line:
        in_fstring = True
        fstring_indent = len(line) - len(line.lstrip())
    
    # Check if we're ending an f-string
    if in_fstring and ('"""' in line and 'f"""' not in line):
        in_fstring = False
    
    # If we're in an f-string and the line has the problematic pattern
    if in_fstring and re.search(r'\$\{[^}]+:,\.0f\}', line):
        # This line needs fixing - but we can't fix it inline
        # We need to extract the value before the f-string
        print(f"Line {i+1} needs manual fixing: {line.strip()}")
    
    fixed_lines.append(line)

print("\nThis script identified the problematic lines.")
print("Manual fixes are required by pre-formatting the values.")
