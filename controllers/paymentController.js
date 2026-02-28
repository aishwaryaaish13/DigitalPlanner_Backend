import Razorpay from 'razorpay';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { amount, currency = 'INR', plan_name, plan_description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: userId,
        plan_name: plan_name || 'Premium Plan',
        plan_description: plan_description || ''
      }
    };

    const order = await razorpay.orders.create(options);

    // Save order to database
    const { data: paymentRecord, error } = await supabase
      .from('payments')
      .insert([{
        user_id: userId,
        order_id: order.id,
        amount: amount,
        currency: currency,
        status: 'created',
        plan_name: plan_name || null,
        plan_description: plan_description || null
      }])
      .select()
      .single();

    if (error) {
      console.error('Error saving payment record:', error);
      // Continue even if DB save fails
    }

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify payment
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification data' });
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Update payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('order_id', razorpay_order_id)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating payment:', error);
        return res.status(500).json({ error: 'Failed to update payment' });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        payment: payment
      });
    } else {
      // Update payment as failed
      await supabase
        .from('payments')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('order_id', razorpay_order_id)
        .eq('user_id', userId);

      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { limit = 50, status } = req.query;

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(200).json({
          payments: [],
          message: 'Payments table not found. Please create the table in Supabase.'
        });
      }
      
      return res.status(500).json({ error: 'Failed to fetch payments' });
    }

    return res.status(200).json({ 
      payments: payments || [],
      count: payments?.length || 0
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const { data: payment, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    return res.status(200).json({ payment });
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Webhook handler for Razorpay events
export const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log('Razorpay webhook event:', event);

    // Handle different events
    switch (event) {
      case 'payment.captured':
        // Payment was successful
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('order_id', payload.order_id);
        break;

      case 'payment.failed':
        // Payment failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('order_id', payload.order_id);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
