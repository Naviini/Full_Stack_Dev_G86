const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Get project analytics
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const tasks = await Task.find({ project: req.params.projectId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

    const byPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      critical: tasks.filter(t => t.priority === 'critical').length,
    };

    const byStatus = {
      todo: todoTasks,
      inProgress: inProgressTasks,
      review: tasks.filter(t => t.status === 'review').length,
      completed: completedTasks,
    };

    const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const budgetUsage = {
      estimated: project.budget.estimated,
      actual: project.budget.actual,
      percentage: project.budget.estimated === 0 ? 0 : Math.round((project.budget.actual / project.budget.estimated) * 100),
    };

    res.json({
      projectName: project.name,
      totalTasks,
      completedTasks,
      completionPercentage,
      byStatus,
      byPriority,
      timeTracking: {
        estimated: totalEstimatedHours,
        actual: totalActualHours,
        variance: totalActualHours - totalEstimatedHours,
      },
      riskMetrics: {
        highPriorityTasks,
        overdueTasks,
      },
      budgetUsage,
      projectStatus: project.status,
      projectDates: {
        start: project.startDate,
        end: project.endDate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard analytics for user
router.get('/dashboard/overview', auth, async (req, res) => {
  try {
    const userId = req.user.user.id;
    
    // Get all projects for user
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    });

    // Get all tasks assigned to user
    const myTasks = await Task.find({ assignee: userId });

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalTasks: myTasks.length,
      completedTasks: myTasks.filter(t => t.status === 'completed').length,
      inProgressTasks: myTasks.filter(t => t.status === 'in-progress').length,
      overdueTasks: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
      totalHoursLogged: myTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
