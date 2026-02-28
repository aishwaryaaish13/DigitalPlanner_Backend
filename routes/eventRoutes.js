import express from 'express';
import {
  getEvents,
  getEventsByDate,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getEvents);
router.get('/date/:date', getEventsByDate);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
