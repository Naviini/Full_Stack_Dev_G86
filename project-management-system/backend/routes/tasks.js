const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// ============ ADMIN ONLY ROUTES (MUST COME FIRST) ============

// Admin: Get all tasks with detailed info
router.get('/admin/list/all', auth, adminAuth, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'name email role')
      .populate('project', 'name')
      .populate('dependencies', 'title status')
      .populate('comments.user', 'name email')
      .populate('timeLogs.user', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get task statistics
router.get('/admin/stats/overview', auth, adminAuth, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const overdueTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    }).populate('assignee', 'name email');

    res.json({
      success: true,
      stats: {
        totalTasks,
        byStatus: tasksByStatus,
        byPriority: tasksByPriority,
        overdueTasks: overdueTasks.length,
        overdueTasksList: overdueTasks
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ============ REGULAR ROUTES ============

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project, assignee, priority, dueDate, estimatedHours } = req.body;

    const task = new Task({
      title,
      description,
      project,
      assignee,
      priority,
      dueDate,
      estimatedHours,
    });

    await task.save();
    await task.populate('assignee');

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks by project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee')
      .populate('comments.user');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, dueDate, estimatedHours, actualHours, assignee } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (actualHours) task.actualHours = actualHours;
    if (assignee) task.assignee = assignee;

    task.updatedAt = Date.now();
    await task.save();
    await task.populate('assignee');

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add subtask
router.post('/:id/subtasks', auth, async (req, res) => {
  try {
    const { title } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.subtasks.push({
      _id: new require('mongoose').Types.ObjectId(),
      title,
      completed: false,
    });

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update subtask
router.put('/:id/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: 'Subtask not found' });
    }

    if (completed !== undefined) subtask.completed = completed;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Log time
router.post('/:id/time-logs', auth, async (req, res) => {
  try {
    const { hours, date, description } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.timeLogs.push({
      user: req.user.user.id,
      hours,
      date: date || new Date(),
      description,
    });

    task.actualHours = task.timeLogs.reduce((sum, log) => sum + log.hours, 0);

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to task
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: req.user.user.id,
      text,
    });

    await task.save();
    await task.populate('comments.user');
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ADMIN ONLY ROUTES ============

// Admin: Update any task with full details
router.put('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { 
      title, 
      description, 
      status, 
      priority, 
      dueDate, 
      estimatedHours, 
      actualHours, 
      assignee,
      dependencies,
      project 
    } = req.body;

    // Allow admins to update all task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (assignee !== undefined) task.assignee = assignee;
    if (dependencies !== undefined) task.dependencies = dependencies;
    if (project !== undefined) task.project = project;

    task.updatedAt = Date.now();
    await task.save();
    await task.populate('assignee');
    await task.populate('dependencies');
    await task.populate('project');

    res.json({
      success: true,
      message: 'Task updated by admin',
      task
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete any task
router.delete('/admin/:id', auth, adminAuth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ 
      success: true,
      message: 'Task deleted by admin',
      deletedTask: task 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Bulk update tasks
router.put('/admin/bulk/update', auth, adminAuth, async (req, res) => {
  try {
    const { taskIds, updates } = req.body;

    if (!Array.isArray(taskIds) || !updates) {
      return res.status(400).json({ message: 'Invalid request: taskIds and updates required' });
    }

    const updatedTasks = await Promise.all(
      taskIds.map(async (taskId) => {
        let task = await Task.findById(taskId);
        if (!task) return null;

        // Apply updates
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined) {
            task[key] = updates[key];
          }
        });

        task.updatedAt = Date.now();
        await task.save();
        await task.populate('assignee');
        return task;
      })
    );

    res.json({
      success: true,
      message: `${updatedTasks.filter(t => t).length} tasks updated by admin`,
      tasks: updatedTasks.filter(t => t)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
