import express from 'express';
import {
  getProductivity,
  initializeProductivity,
  completeTask,
  uncompleteTask,
  completeGoal,
  updateTotalGoals,
  completeFocusSession,
  unlockBadge
} from '../controllers/productivityController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// GET / - Get user's productivity data
router.get('/', getProductivity);

// POST /initialize - Create initial productivity record
router.post('/initialize', initializeProductivity);

// POST /task-complete - Mark task as completed for a date
router.post('/task-complete', completeTask);

// POST /task-uncomplete - Mark task as uncompleted for a date
router.post('/task-uncomplete', uncompleteTask);

// POST /goal-complete - Increment goals completed
router.post('/goal-complete', completeGoal);

// PUT /total-goals - Update total goals count
router.put('/total-goals', updateTotalGoals);

// POST /focus-complete - Increment focus sessions
router.post('/focus-complete', completeFocusSession);

// POST /unlock-badge - Add badge to unlocked badges
router.post('/unlock-badge', unlockBadge);

export default router;
