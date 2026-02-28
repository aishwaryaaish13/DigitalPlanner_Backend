-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(255) NOT NULL,
  payment_id VARCHAR(255),
  signature VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'created',
  plan_name VARCHAR(255),
  plan_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(order_id)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own payments
CREATE POLICY "Users can view their own payments"
  ON payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own payments
CREATE POLICY "Users can insert their own payments"
  ON payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own payments
CREATE POLICY "Users can update their own payments"
  ON payments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own payments
CREATE POLICY "Users can delete their own payments"
  ON payments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to get payment statistics
CREATE OR REPLACE FUNCTION get_payment_stats(p_user_id UUID)
RETURNS TABLE (
  total_payments BIGINT,
  total_amount BIGINT,
  completed_payments BIGINT,
  failed_payments BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_payments,
    COALESCE(SUM(amount), 0)::BIGINT as total_amount,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_payments,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_payments
  FROM payments
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
