import express from 'express';
import { 
  createOrder, 
  verifyPayment, 
  getPaymentHistory, 
  getPaymentById,
  handleWebhook 
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook route (no auth required)
router.post('/webhook', handleWebhook);

// Protect all other routes
router.use(authMiddleware);

// POST /api/payments/create-order - Create Razorpay order
router.post('/create-order', createOrder);

// POST /api/payments/verify - Verify payment
router.post('/verify', verifyPayment);

// GET /api/payments/history - Get payment history
router.get('/history', getPaymentHistory);

// GET /api/payments/:id - Get payment by ID
router.get('/:id', getPaymentById);

export default router;
