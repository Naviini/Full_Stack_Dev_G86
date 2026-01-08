const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Add milestone
router.post('/:projectId/milestones', auth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.milestones.push({
      _id: new require('mongoose').Types.ObjectId(),
      title,
      description,
      dueDate,
      completed: false,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update milestone
router.put('/:projectId/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const { completed, title, description, dueDate } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (dueDate) milestone.dueDate = dueDate;
    if (completed !== undefined) {
      milestone.completed = completed;
      if (completed) milestone.completedAt = new Date();
    }

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add risk
router.post('/:projectId/risks', auth, async (req, res) => {
  try {
    const { title, description, probability, impact, mitigation } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.risks.push({
      _id: new require('mongoose').Types.ObjectId(),
      title,
      description,
      probability,
      impact,
      mitigation,
      status: 'open',
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update risk
router.put('/:projectId/risks/:riskId', auth, async (req, res) => {
  try {
    const { status, title, description, probability, impact, mitigation } = req.body;
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const risk = project.risks.id(req.params.riskId);
    if (!risk) {
      return res.status(404).json({ message: 'Risk not found' });
    }

    if (title) risk.title = title;
    if (description) risk.description = description;
    if (probability) risk.probability = probability;
    if (impact) risk.impact = impact;
    if (mitigation) risk.mitigation = mitigation;
    if (status) risk.status = status;

    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
