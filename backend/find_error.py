# -*- coding: utf-8 -*-
import ast

def find_syntax_error():
    filename = 'orders/email_service.py'
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to parse with AST to get precise error
        try:
            ast.parse(content)
            print("✓ Success: File is syntactically correct.")
        except SyntaxError as e:
            print(f"✗ Syntax Error at line {e.lineno}: {e.msg}")
            print(f"   Text: {repr(e.text)}")
            
            # If it's an unclosed string, the line number might be misleading (end of file)
            # Let's count all occurrences of f\"\"\", \"\"\", f''', '''
            # and verify they are balanced
            
            lines = content.splitlines()
            stack = []
            
            for i, line in enumerate(lines):
                line_no = i + 1
                
                # This is a naive scanner but might help
                idx = 0
                while idx < len(line):
                    # Check for start of string if not in one
                    if not stack:
                        # Check longest matches first
                        if line[idx:idx+4] in ['f"""', "f'''"]:
                            stack.append((line[idx+1:idx+4], line_no))
                            idx += 4
                        elif line[idx:idx+3] in ['"""', "'''"]:
                            stack.append((line[idx:idx+3], line_no))
                            idx += 3
                        else:
                            idx += 1
                    else:
                        # In a string, look for close
                        quote_type, start_line = stack[-1]
                        if line[idx:idx+3] == quote_type:
                            stack.pop()
                            idx += 3
                        else:
                            idx += 1
            
            if stack:
                for q, l in stack:
                    print(f"!!! TRIPLE QUOTE UNCLOSED: {q} started at line {l}")
            else:
                print("Triple quotes seem balanced by naive count.")

    except Exception as e:
        print(f"Unexpected error during analysis: {e}")

if __name__ == "__main__":
    find_syntax_error()
