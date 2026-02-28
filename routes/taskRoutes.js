import express from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/taskController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// POST / - Create a new task
router.post('/', createTask);

// GET / - Retrieve all tasks
router.get('/', getTasks);

// PUT /:id - Update a task by ID
router.put('/:id', updateTask);

// DELETE /:id - Delete a task by ID
router.delete('/:id', deleteTask);

export default router;
