import express from 'express';
import { 
  createJournalEntry, 
  getJournalEntries, 
  updateJournalEntry,
  deleteJournalEntry 
} from '../controllers/journalController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(authMiddleware);

// POST / - Create a new journal entry
router.post('/', createJournalEntry);

// GET / - Retrieve all journal entries
router.get('/', getJournalEntries);

// PUT /:id - Update a journal entry by ID
router.put('/:id', updateJournalEntry);

// DELETE /:id - Delete a journal entry by ID
router.delete('/:id', deleteJournalEntry);

export default router;