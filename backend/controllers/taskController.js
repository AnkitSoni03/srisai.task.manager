import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';

// @desc    Get user tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
  res.json(tasks);
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, dueDate } = req.body;

  if (!title || title.trim() === '') {
    res.status(400);
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'todo',
    dueDate: dueDate || null,
    user: req.user._id,
  });

  // Populate user data before sending
  await task.populate('user', 'name email');

  // Emit socket event to ALL users except the creator
  const io = req.app.get('io');
  if (io) {
    io.emit('taskCreated', {
      message: `🎯 New task created: "${task.title}"`,
      task: task,
      actionBy: req.user.name,
      userId: req.user._id.toString(),
      timestamp: new Date()
    });
    console.log(`📢 taskCreated event emitted by ${req.user.name}`);
  }

  res.status(201).json(task);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('user', 'name email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task belongs to the user
  if (task.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  task.title = req.body.title ? req.body.title.trim() : task.title;
  task.description = req.body.description ? req.body.description.trim() : task.description;
  task.status = req.body.status || task.status;
  task.dueDate = req.body.dueDate || task.dueDate;

  const updatedTask = await task.save();

  // Emit socket event to ALL users except the updater
  const io = req.app.get('io');
  if (io) {
    io.emit('taskUpdated', {
      message: `✏️ Task updated: "${updatedTask.title}"`,
      task: updatedTask,
      actionBy: req.user.name,
      userId: req.user._id.toString(),
      timestamp: new Date()
    });
    console.log(`📢 taskUpdated event emitted by ${req.user.name}`);
  }

  res.json(updatedTask);
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('user', 'name email');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  // Check if task belongs to the user
  if (task.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  // Emit socket event BEFORE deletion
  const io = req.app.get('io');
  if (io) {
    io.emit('taskDeleted', {
      message: `🗑️ Task deleted: "${task.title}"`,
      taskId: req.params.id,
      taskTitle: task.title,
      actionBy: req.user.name,
      userId: req.user._id.toString(),
      timestamp: new Date()
    });
    console.log(`📢 taskDeleted event emitted by ${req.user.name}`);
  }

  await Task.deleteOne({ _id: req.params.id });

  res.json({ 
    message: 'Task removed successfully', 
    taskId: req.params.id 
  });
});

// @desc    Get all tasks (for real-time display)
// @route   GET /api/tasks/all
// @access  Private
const getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find()
    .sort({ createdAt: -1 })
    .populate('user', 'name email');
  res.json(tasks);
});

export { getTasks, createTask, updateTask, deleteTask, getAllTasks };