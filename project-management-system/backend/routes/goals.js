const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Create goal
router.post('/', auth, async (req, res) => {
  try {
    const { project, title, description, type, priority, startDate, dueDate, targetValue, unit, owner } = req.body;

    if (!project || !title || !startDate || !dueDate) {
      return res.status(400).json({ message: 'Project, title, start date, and due date are required' });
    }

    const goal = new Goal({
      project,
      title,
      description: description || '',
      type: type || 'strategic',
      priority: priority || 'medium',
      startDate,
      dueDate,
      targetValue: targetValue || '',
      unit: unit || '',
      owner: owner || req.user.user.id,
    });

    await goal.save();
    await goal.populate(['owner', 'relatedTasks']);

    res.status(201).json(goal);
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all goals for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const goals = await Goal.find({ project: projectId })
      .populate(['owner', 'relatedTasks'])
      .sort({ priority: -1, dueDate: 1 });

    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single goal
router.get('/:goalId', auth, async (req, res) => {
  try {
    const { goalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findById(goalId).populate(['owner', 'relatedTasks']);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update goal
router.put('/:goalId', auth, async (req, res) => {
  try {
    const { goalId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findByIdAndUpdate(
      goalId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate(['owner', 'relatedTasks']);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add key result to goal
router.post('/:goalId/key-results', auth, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { title, targetValue, weight } = req.body;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const keyResult = {
      _id: new mongoose.Types.ObjectId(),
      title,
      targetValue: targetValue || '',
      currentValue: '',
      weight: weight || 25,
      status: 'not-started',
    };

    goal.keyResults.push(keyResult);
    await goal.save();

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error adding key result:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Link related task to goal
router.post('/:goalId/tasks/:taskId', auth, async (req, res) => {
  try {
    const { goalId, taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(goalId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: 'Invalid goal or task ID' });
    }

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (!goal.relatedTasks.includes(taskId)) {
      goal.relatedTasks.push(taskId);
      await goal.save();
    }

    await goal.populate(['owner', 'relatedTasks']);

    res.json(goal);
  } catch (error) {
    console.error('Error linking task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add note to goal
router.post('/:goalId/notes', auth, async (req, res) => {
  try {
    const { goalId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findById(goalId);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.notes.push({
      user: req.user.user.id,
      text,
      createdAt: Date.now(),
    });

    await goal.save();
    await goal.populate(['owner', 'relatedTasks']);

    res.status(201).json(goal);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete goal
router.delete('/:goalId', auth, async (req, res) => {
  try {
    const { goalId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(goalId)) {
      return res.status(400).json({ message: 'Invalid goal ID' });
    }

    const goal = await Goal.findByIdAndDelete(goalId);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
