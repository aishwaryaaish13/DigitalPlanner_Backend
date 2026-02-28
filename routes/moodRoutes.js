import express from 'express';
import { logMood, getMoodLogs, deleteMood } from '../controllers/moodController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// POST / - Log a mood entry
router.post('/', logMood);

// GET / - Retrieve all mood logs
router.get('/', getMoodLogs);

// DELETE /:id - Delete a mood log by ID
router.delete('/:id', deleteMood);

export default router;
