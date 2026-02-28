# Razorpay Payment Integration Setup

## Backend Setup Complete ✅

The following has been set up:
- Payment controller with all endpoints
- Payment routes with authentication
- Database schema for payments table
- Environment variables configuration

## Setup Steps

### 1. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test/Live API Keys
4. Copy Key ID and Key Secret

### 2. Configure Environment Variables

Update your `.env` file with actual Razorpay credentials:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret (optional)
```

### 3. Create Database Table

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase_payments_table.sql`
4. Run the query

### 4. Restart Server

```bash
npm run dev
```

## API Endpoints

All endpoints require authentication (JWT token).

### Create Order
```
POST /api/payments/create-order
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 99900,
  "currency": "INR",
  "plan_name": "Premium Plan",
  "plan_description": "Monthly subscription"
}

Response:
{
  "orderId": "order_xxxxx",
  "amount": 99900,
  "currency": "INR",
  "keyId": "rzp_test_xxxxx"
}
```

### Verify Payment
```
POST /api/payments/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "razorpay_order_id": "order_xxxxx",
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_signature": "signature_xxxxx"
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "payment": { ... }
}
```

### Get Payment History
```
GET /api/payments/history?limit=50&status=completed
Authorization: Bearer <token>

Response:
{
  "payments": [...],
  "count": 10
}
```

### Get Payment by ID
```
GET /api/payments/:id
Authorization: Bearer <token>

Response:
{
  "payment": { ... }
}
```

### Webhook (No Auth Required)
```
POST /api/payments/webhook
Content-Type: application/json
X-Razorpay-Signature: <signature>

Razorpay will send payment events here
```

## Frontend Integration Example

### Install Razorpay Script

Add to your `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Payment Component Example

```javascript
import { useState } from 'react';
import axios from 'axios';

const PaymentButton = ({ amount, planName, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Create order
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/create-order',
        {
          amount: amount,
          currency: 'INR',
          plan_name: planName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Razorpay options
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Your App Name',
        description: planName,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              'http://localhost:5000/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );

            if (verifyResponse.data.success) {
              onSuccess?.(verifyResponse.data);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            onFailure?.(error);
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed:', response.error);
        onFailure?.(response.error);
      });

    } catch (error) {
      console.error('Error creating order:', error);
      onFailure?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Pay ₹${amount / 100}`}
    </button>
  );
};

export default PaymentButton;
```

## Test Mode

### Test Card Details
Use these in Razorpay test mode:

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4111 1111 1111 1234
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI
- UPI ID: success@razorpay
- UPI ID (failure): failure@razorpay

## Webhook Setup (Optional)

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: payment.captured, payment.failed
4. Copy webhook secret and add to `.env`

## Security Best Practices

1. ✅ Never expose Razorpay Key Secret in frontend
2. ✅ Always verify payment signature on backend
3. ✅ Store payment records in database
4. ✅ Use HTTPS in production
5. ✅ Implement rate limiting on payment endpoints
6. ✅ Log all payment transactions
7. ✅ Handle webhook events properly
8. ✅ Validate amounts on backend

## Payment Flow

1. User clicks "Pay" button
2. Frontend calls `/api/payments/create-order`
3. Backend creates Razorpay order and saves to DB
4. Frontend opens Razorpay checkout
5. User completes payment
6. Razorpay calls success handler
7. Frontend calls `/api/payments/verify`
8. Backend verifies signature and updates DB
9. Success callback executed

## Troubleshooting

### Payment not creating
- Check Razorpay credentials in `.env`
- Verify amount is in paise (₹1 = 100 paise)
- Check backend logs for errors

### Verification failing
- Ensure signature verification logic is correct
- Check if order_id matches
- Verify Razorpay Key Secret is correct

### Webhook not working
- Ensure webhook URL is publicly accessible
- Check webhook secret configuration
- Verify webhook signature validation

## Production Checklist

- [ ] Switch to live Razorpay keys
- [ ] Enable HTTPS
- [ ] Set up webhook endpoint
- [ ] Add rate limiting
- [ ] Implement proper error handling
- [ ] Add payment retry logic
- [ ] Set up payment monitoring
- [ ] Configure email notifications
- [ ] Add refund functionality (if needed)
- [ ] Test all payment scenarios

## Support

For Razorpay specific issues:
- Documentation: https://razorpay.com/docs/
- Support: https://razorpay.com/support/
