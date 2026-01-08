const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, startDate, endDate, budget, status, progress } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, start date, and end date are required' });
    }

    const project = new Project({
      name,
      description: description || '',
      owner: req.user.user.id,
      startDate,
      endDate,
      budget: budget || { estimated: 0, actual: 0 },
      status: status || 'planning',
      progress: progress || 0,
      members: [{
        user: req.user.user.id,
        role: 'admin',
      }],
    });

    await project.save();
    await project.populate('owner members.user');

    res.status(201).json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.user.id;

    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId },
      ],
    })
      .populate('owner')
      .populate('members.user')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner members');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project
router.put('/:id', auth, async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, description, status, startDate, endDate, budget, progress, members } = req.body;

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (endDate) project.endDate = endDate;
    if (budget) project.budget = budget;
    if (progress) project.progress = progress;
    if (members) project.members = members;

    project.updatedAt = Date.now();
    await project.save();
    await project.populate('owner members');

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
