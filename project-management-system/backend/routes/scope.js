const express = require('express');
const router = express.Router();
const Scope = require('../models/Scope');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Create scope document
router.post('/', auth, async (req, res) => {
  try {
    const { project, scopeStatement } = req.body;

    if (!project) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const scope = new Scope({
      project,
      scopeStatement: scopeStatement || '',
      lastUpdatedBy: req.user.user.id,
    });

    await scope.save();
    await scope.populate('lastUpdatedBy');

    res.status(201).json(scope);
  } catch (error) {
    console.error('Scope creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get scope for project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const scope = await Scope.findOne({ project: projectId }).populate('lastUpdatedBy changeHistory.changedBy');

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    res.json(scope);
  } catch (error) {
    console.error('Error fetching scope:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update scope document
router.put('/:scopeId', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { scopeStatement, ...updates } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    if (scopeStatement !== scope.scopeStatement && scopeStatement) {
      scope.changeHistory.push({
        date: Date.now(),
        changedBy: req.user.user.id,
        changeDescription: `Scope statement updated`,
        impact: 'Documentation updated',
      });
    }

    Object.assign(scope, updates);
    scope.lastUpdatedBy = req.user.user.id;
    scope.updatedAt = Date.now();

    await scope.save();
    await scope.populate('lastUpdatedBy changeHistory.changedBy');

    res.json(scope);
  } catch (error) {
    console.error('Error updating scope:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add deliverable
router.post('/:scopeId/deliverables', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { title, description, dueDate, priority, owner } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const deliverable = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description: description || '',
      status: 'pending',
      dueDate,
      priority: priority || 'medium',
      owner: owner || req.user.user.id,
      completionPercentage: 0,
      createdAt: Date.now(),
    };

    scope.deliverables.push(deliverable);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding deliverable:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add requirement
router.post('/:scopeId/requirements', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { title, description, type, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const requirement = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description: description || '',
      type: type || 'functional',
      priority: priority || 'medium',
      status: 'identified',
      createdAt: Date.now(),
    };

    scope.requirements.push(requirement);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding requirement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add constraint
router.post('/:scopeId/constraints', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { title, description, type, impact, mitigation } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const constraint = {
      _id: new mongoose.Types.ObjectId(),
      title,
      description: description || '',
      type: type || 'schedule',
      impact: impact || 'medium',
      mitigation: mitigation || '',
      createdAt: Date.now(),
    };

    scope.constraints.push(constraint);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding constraint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add assumption
router.post('/:scopeId/assumptions', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { statement } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const assumption = {
      _id: new mongoose.Types.ObjectId(),
      statement,
      verified: false,
      createdAt: Date.now(),
    };

    scope.assumptions.push(assumption);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding assumption:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add inclusion
router.post('/:scopeId/inclusions', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { item, priority } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const inclusion = {
      _id: new mongoose.Types.ObjectId(),
      item,
      priority: priority || 'medium',
      createdAt: Date.now(),
    };

    scope.inclusions.push(inclusion);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding inclusion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add exclusion
router.post('/:scopeId/exclusions', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;
    const { item, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findById(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    const exclusion = {
      _id: new mongoose.Types.ObjectId(),
      item,
      reason: reason || '',
      createdAt: Date.now(),
    };

    scope.exclusions.push(exclusion);
    await scope.save();

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error adding exclusion:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete scope
router.delete('/:scopeId', auth, async (req, res) => {
  try {
    const { scopeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scopeId)) {
      return res.status(400).json({ message: 'Invalid scope ID' });
    }

    const scope = await Scope.findByIdAndDelete(scopeId);

    if (!scope) {
      return res.status(404).json({ message: 'Scope not found' });
    }

    res.json({ message: 'Scope deleted successfully' });
  } catch (error) {
    console.error('Error deleting scope:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
