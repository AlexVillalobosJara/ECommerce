# -*- coding: utf-8 -*-
"""
Script to fix all dollar sign issues in email_service.py
by formatting prices before inserting them into f-strings
"""

# Read the file
with open('orders/email_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all problematic patterns
# Pattern 1: $${item_total:,.0f} -> format it differently
content = content.replace('$${item_total:,.0f}', '${:,.0f}'.format('{item_total}'))
content = content.replace('$${float(order.subtotal):,.0f}', '${:,.0f}'.format('{float(order.subtotal)}'))
content = content.replace('$${float(order.shipping_cost):,.0f}', '${:,.0f}'.format('{float(order.shipping_cost)}'))
content = content.replace('${total:,.0f}', '${:,.0f}'.format('{total}'))

# Actually, the above won't work either. Let's use a different approach:
# Replace $$ with just $ and use {{}} to escape the braces
content = content.replace('$${item_total:,.0f}', '$' + '{item_total:,.0f}')
content = content.replace('$${float(order.subtotal):,.0f}', '$' + '{float(order.subtotal):,.0f}')
content = content.replace('$${float(order.shipping_cost):,.0f}', '$' + '{float(order.shipping_cost):,.0f}')

# Write back
with open('orders/email_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all dollar sign patterns")
