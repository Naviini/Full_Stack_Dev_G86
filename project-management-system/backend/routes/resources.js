const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Create resource
router.post('/', auth, async (req, res) => {
  try {
    const { project, name, type, quantity, unit, category, costPerUnit, role, skills } = req.body;

    if (!project || !name || !type || !quantity) {
      return res.status(400).json({ message: 'Project, name, type, and quantity are required' });
    }

    const resource = new Resource({
      project,
      name,
      type,
      quantity,
      unit: unit || 'units',
      category: category || '',
      costPerUnit: costPerUnit || 0,
      totalCost: (costPerUnit || 0) * quantity,
      role: role || '',
      skills: skills || [],
      createdBy: req.user.user.id,
    });

    await resource.save();
    await resource.populate(['assignedTo', 'createdBy', 'allocations.task', 'allocations.allocatedBy']);

    res.status(201).json(resource);
  } catch (error) {
    console.error('Resource creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all resources for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type, status } = req.query;

    let query = { project: projectId };

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    const resources = await Resource.find(query)
      .populate(['assignedTo', 'createdBy', 'allocations.task', 'allocations.allocatedBy'])
      .sort({ type: 1, name: 1 });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single resource
router.get('/:resourceId', auth, async (req, res) => {
  try {
    const { resourceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID' });
    }

    const resource = await Resource.findById(resourceId)
      .populate(['assignedTo', 'createdBy', 'allocations.task', 'allocations.allocatedBy']);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update resource
router.put('/:resourceId', auth, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID' });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Recalculate total cost if quantity or costPerUnit changes
    if (updates.quantity || updates.costPerUnit) {
      const quantity = updates.quantity || resource.quantity;
      const costPerUnit = updates.costPerUnit || resource.costPerUnit;
      updates.totalCost = quantity * costPerUnit;
    }

    Object.assign(resource, updates);
    resource.updatedAt = Date.now();

    await resource.save();
    await resource.populate(['assignedTo', 'createdBy', 'allocations.task', 'allocations.allocatedBy']);

    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Allocate resource to task
router.post('/:resourceId/allocate', auth, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { task, startDate, endDate, allocatedPercentage, allocatedQuantity, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID' });
    }

    if (!task || !startDate || !endDate) {
      return res.status(400).json({ message: 'Task, start date, and end date are required' });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const allocation = {
      _id: new mongoose.Types.ObjectId(),
      task,
      startDate,
      endDate,
      allocatedPercentage: allocatedPercentage || 100,
      allocatedQuantity: allocatedQuantity || resource.quantity,
      allocatedBy: req.user.user.id,
      notes: notes || '',
      createdAt: Date.now(),
    };

    resource.allocations.push(allocation);

    // Update allocation percentage
    const totalAllocated = resource.allocations.reduce((sum, a) => sum + a.allocatedPercentage, 0);
    resource.allocationPercentage = Math.min(totalAllocated, 100);

    if (totalAllocated > 0) {
      resource.status = 'allocated';
    }

    await resource.save();
    await resource.populate(['assignedTo', 'createdBy', 'allocations.task', 'allocations.allocatedBy']);

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error allocating resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get resource utilization for project
router.get('/project/:projectId/utilization', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const resources = await Resource.find({ project: projectId })
      .populate(['assignedTo', 'allocations.task']);

    const utilization = {
      total: resources.length,
      byType: {},
      totalCost: 0,
      allocatedCost: 0,
      utilizationRate: 0,
      resources: resources.map(r => ({
        id: r._id,
        name: r.name,
        type: r.type,
        quantity: r.quantity,
        allocation: r.allocationPercentage,
        cost: r.totalCost,
        assignedTo: r.assignedTo?.name || 'Unassigned',
      })),
    };

    resources.forEach(r => {
      if (!utilization.byType[r.type]) {
        utilization.byType[r.type] = { count: 0, allocated: 0, cost: 0 };
      }
      utilization.byType[r.type].count++;
      if (r.allocationPercentage > 0) {
        utilization.byType[r.type].allocated++;
      }
      utilization.byType[r.type].cost += r.totalCost;
      utilization.totalCost += r.totalCost;
      if (r.allocationPercentage > 0) {
        utilization.allocatedCost += r.totalCost;
      }
    });

    utilization.utilizationRate = resources.length > 0
      ? ((resources.filter(r => r.allocationPercentage > 0).length / resources.length) * 100).toFixed(2)
      : 0;

    res.json(utilization);
  } catch (error) {
    console.error('Error calculating utilization:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete resource
router.delete('/:resourceId', auth, async (req, res) => {
  try {
    const { resourceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ message: 'Invalid resource ID' });
    }

    const resource = await Resource.findByIdAndDelete(resourceId);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
