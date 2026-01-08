const express = require('express');
const router = express.Router();
const Planning = require('../models/Planning');
const auth = require('../middleware/auth');

// Get all planning documents for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { type, status } = req.query;
    const query = { project: req.params.projectId };

    if (type) query.type = type;
    if (status) query.status = status;

    const plans = await Planning.find(query)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single planning document
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await Planning.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create planning document
router.post('/', auth, async (req, res) => {
  const plan = new Planning({
    ...req.body,
    createdBy: req.user.id,
  });

  try {
    const newPlan = await plan.save();
    await newPlan.populate('createdBy', 'name email');
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update planning document
router.put('/:id', auth, async (req, res) => {
  try {
    const plan = await Planning.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    Object.assign(plan, req.body);
    plan.updatedAt = Date.now();

    const updated = await plan.save();
    await updated.populate(['createdBy', 'approvedBy']);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update lifecycle phase
router.patch('/:id/lifecycle/:phase', auth, async (req, res) => {
  try {
    const plan = await Planning.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const validPhases = ['initiation', 'planning', 'execution', 'monitoring', 'closure'];
    if (!validPhases.includes(req.params.phase)) {
      return res.status(400).json({ message: 'Invalid phase' });
    }

    plan.lifecycle[req.params.phase] = {
      completed: true,
      date: Date.now(),
      notes: req.body.notes || '',
    };
    plan.updatedAt = Date.now();

    const updated = await plan.save();
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve planning document
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const plan = await Planning.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    plan.status = 'approved';
    plan.approvedBy = req.user.id;
    plan.approvalDate = Date.now();
    plan.updatedAt = Date.now();

    const updated = await plan.save();
    await updated.populate(['createdBy', 'approvedBy']);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete planning document
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await Planning.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
