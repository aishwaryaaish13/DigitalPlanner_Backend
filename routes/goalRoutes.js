import express from 'express';
import { createGoal, getGoals, updateGoal, deleteGoal } from '../controllers/goalController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// POST / - Create a new goal
router.post('/', createGoal);

// GET / - Retrieve all goals
router.get('/', getGoals);

// PUT /:id - Update a goal by ID
router.put('/:id', updateGoal);

// DELETE /:id - Delete a goal by ID
router.delete('/:id', deleteGoal);

export default router;
