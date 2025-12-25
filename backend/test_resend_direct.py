"""
Direct Resend API test
"""
import resend

# Set API key
resend.api_key = "re_QMGM6YQv_EtfktDks2A3HCHijynZZU25U"

print("Testing Resend API...")
print(f"API Key: {resend.api_key[:10]}...")

try:
    # Send a simple test email
    params = {
        "from": "onboarding@resend.dev",
        "to": "arvillalobos@gmail.com",
        "subject": "Test Email from Django",
        "html": "<p>This is a test email to verify Resend is working.</p>"
    }
    
    print(f"Sending to: {params['to']}")
    print(f"From: {params['from']}")
    
    response = resend.Emails.send(params)
    
    print(f"Response: {response}")
    print(f"Response type: {type(response)}")
    
    if response:
        print("SUCCESS - Email sent!")
    else:
        print("WARNING - Response is None but email may have been sent")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
