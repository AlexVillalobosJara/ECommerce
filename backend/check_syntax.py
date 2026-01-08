# -*- coding: utf-8 -*-
try:
    with open('orders/email_service.py', 'r', encoding='utf-8') as f:
        code = f.read()
    compile(code, 'email_service.py', 'exec')
    print("✓ File compiles successfully!")
except SyntaxError as e:
    print(f"✗ Syntax Error at line {e.lineno}: {e.msg}")
    if e.text:
        print(f"   Text: {e.text.strip()}")
    print(f"   Offset: {e.offset}")
