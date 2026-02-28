import express from 'express';
import { createHabit, getHabits, updateHabit, deleteHabit } from '../controllers/habitController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// POST / - Create a new habit
router.post('/', createHabit);

// GET / - Retrieve all habits
router.get('/', getHabits);

// PUT /:id - Update a habit by ID
router.put('/:id', updateHabit);

// DELETE /:id - Delete a habit by ID
router.delete('/:id', deleteHabit);

export default router;
