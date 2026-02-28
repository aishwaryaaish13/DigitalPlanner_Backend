import supabase from '../config/supabase.js';

// Create order (placeholder - Razorpay integration disabled)
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { amount, currency = 'INR', plan_name, plan_description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    return res.status(200).json({
      message: 'Payment integration disabled. Configure Razorpay to enable payments.',
      orderId: `placeholder_${Date.now()}`,
      amount: amount,
      currency: currency,
      plan_name: plan_name || 'Premium Plan'
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ 
      error: 'Failed to create order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify payment (placeholder - Razorpay integration disabled)
export const verifyPayment = async (req, res) => {
  try {
    return res.status(200).json({
      success: false,
      message: 'Payment integration disabled. Configure Razorpay to enable payment verification.'
    });
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

// Webhook handler (placeholder - Razorpay integration disabled)
export const handleWebhook = async (req, res) => {
  try {
    console.log('Webhook received but payment integration is disabled');
    return res.status(200).json({ 
      received: true,
      message: 'Payment integration disabled'
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
