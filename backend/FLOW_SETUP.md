# Flow Payment Gateway Configuration

## Environment Variables

Add these to your `.env` file or environment:

```bash
# Flow Payment Gateway
FLOW_API_KEY=your_flow_api_key_here
FLOW_SECRET_KEY=your_flow_secret_key_here
FLOW_ENV=sandbox  # Use 'sandbox' for testing, 'production' for live

# Payment URLs
PAYMENT_WEBHOOK_URL=http://localhost:8000/api/storefront
```

## Flow Sandbox Credentials

For testing, you can get sandbox credentials from:
https://www.flow.cl/app/web/sandbox.php

## API Endpoints

### Initiate Payment
```
POST /api/storefront/{tenant_slug}/payments/initiate/

Body:
{
  "order_id": "uuid",
  "gateway": "Flow",
  "return_url": "http://localhost:3000/payment/callback",
  "cancel_url": "http://localhost:3000/payment/cancelled"
}

Response:
{
  "payment_id": "uuid",
  "payment_url": "https://sandbox.flow.cl/app/web/pay.php?token=...",
  "gateway": "Flow",
  "transaction_id": "123456"
}
```

### Payment Callback (Webhook)
```
POST /api/storefront/{tenant_slug}/payments/callback/Flow/

Flow will send: token parameter
```

### Check Payment Status
```
GET /api/storefront/{tenant_slug}/payments/status/{order_id}/

Response:
{
  "order_id": "uuid",
  "order_number": "DEMO-STORE-000012",
  "payment_id": "uuid",
  "payment_status": "completed",
  "payment_gateway": "Flow",
  "amount": "50000.00",
  "currency": "CLP",
  "paid_at": "2025-12-17T19:00:00Z"
}
```

## Testing Flow Integration

1. **Set up credentials** in your environment
2. **Create an order** through the checkout
3. **Initiate payment** with the order ID
4. **Redirect to Flow** payment page
5. **Complete payment** using test cards
6. **Flow calls webhook** to confirm payment
7. **Check payment status** to verify

## Flow Test Cards

In sandbox mode, use these test cards:

- **Approved**: 4111 1111 1111 1111
- **Rejected**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Webhook Configuration

Flow needs to know your webhook URL. Configure it in Flow's dashboard:
```
https://your-domain.com/api/storefront/{tenant_slug}/payments/callback/Flow/
```

For local testing with ngrok:
```bash
ngrok http 8000
# Use the ngrok URL: https://xxxxx.ngrok.io/api/storefront/{tenant_slug}/payments/callback/Flow/
```
