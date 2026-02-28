import express from 'express';
import { analyzeText } from '../controllers/aiController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect route with authentication middleware
router.use(authMiddleware);

// POST / - Analyze text with AI insights
router.post('/analyze', analyzeText);

export default router;
