# -*- coding: utf-8 -*-
import sys

def check_email_service():
    try:
        with open('orders/email_service.py', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        in_triple_quotes = False
        quote_symbol = None
        opening_line = -1
        
        for i, line in enumerate(lines):
            line_no = i + 1
            idx = 0
            while idx < len(line):
                if not in_triple_quotes:
                    # Check for f""" or """ or f''' or '''
                    if line[idx:idx+4] == 'f"""':
                        in_triple_quotes = True
                        quote_symbol = '"""'
                        opening_line = line_no
                        idx += 4
                    elif line[idx:idx+3] == '"""':
                        in_triple_quotes = True
                        quote_symbol = '"""'
                        opening_line = line_no
                        idx += 3
                    elif line[idx:idx+4] == "f'''":
                        in_triple_quotes = True
                        quote_symbol = "'''"
                        opening_line = line_no
                        idx += 4
                    elif line[idx:idx+3] == "'''":
                        in_triple_quotes = True
                        quote_symbol = "'''"
                        opening_line = line_no
                        idx += 3
                    else:
                        idx += 1
                else:
                    # Check for closing quote
                    if line[idx:idx+3] == quote_symbol:
                        in_triple_quotes = False
                        quote_symbol = None
                        opening_line = -1
                        idx += 3
                    else:
                        idx += 1
                        
        if in_triple_quotes:
            print(f"✗ ERROR: Unclosed triple quote {quote_symbol} starting at line {opening_line}")
        else:
            print("✓ No unclosed triple quotes found.")
            
        # Also try to compile
        try:
            with open('orders/email_service.py', 'r', encoding='utf-8') as f:
                content = f.read()
            compile(content, 'orders/email_service.py', 'exec')
            print("✓ File compiles successfully.")
        except SyntaxError as e:
            print(f"✗ Syntax Error at line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")
                
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

if __name__ == "__main__":
    check_email_service()
