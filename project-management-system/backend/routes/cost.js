const express = require('express');
const router = express.Router();
const CostManagement = require('../models/CostManagement');
const auth = require('../middleware/auth');

// Get all cost items for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const costs = await CostManagement.find({ project: req.params.projectId })
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate totals
    const estimatedTotal = costs.reduce((sum, c) => sum + c.estimatedCost, 0);
    const actualTotal = costs.reduce((sum, c) => sum + c.actualCost, 0);
    const varianceTotal = actualTotal - estimatedTotal;

    res.json({
      costs,
      summary: {
        estimatedTotal,
        actualTotal,
        varianceTotal,
        variancePercentage: estimatedTotal ? ((varianceTotal / estimatedTotal) * 100).toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create cost item
router.post('/', auth, async (req, res) => {
  const cost = new CostManagement({
    ...req.body,
    createdBy: req.user.id,
  });

  try {
    const newCost = await cost.save();
    await newCost.populate('createdBy', 'name email');
    res.status(201).json(newCost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update cost item
router.put('/:id', auth, async (req, res) => {
  try {
    const cost = await CostManagement.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost item not found' });

    Object.assign(cost, req.body);
    if (req.body.actualCost && req.body.estimatedCost) {
      cost.variance = req.body.actualCost - req.body.estimatedCost;
    }
    cost.updatedAt = Date.now();

    const updatedCost = await cost.save();
    await updatedCost.populate(['createdBy', 'approvedBy']);
    res.json(updatedCost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve cost item
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const cost = await CostManagement.findById(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost item not found' });

    cost.status = 'approved';
    cost.approvedBy = req.user.id;
    cost.approvalDate = Date.now();
    cost.updatedAt = Date.now();

    const updatedCost = await cost.save();
    await updatedCost.populate(['createdBy', 'approvedBy']);
    res.json(updatedCost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete cost item
router.delete('/:id', auth, async (req, res) => {
  try {
    const cost = await CostManagement.findByIdAndDelete(req.params.id);
    if (!cost) return res.status(404).json({ message: 'Cost item not found' });
    res.json({ message: 'Cost item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
