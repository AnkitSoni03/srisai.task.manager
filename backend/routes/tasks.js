import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, getAllTasks } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

// NEW: Add this route for all tasks
router.route('/all')
  .get(protect, getAllTasks);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

export default router;