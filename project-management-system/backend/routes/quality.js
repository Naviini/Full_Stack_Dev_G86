const express = require('express');
const router = express.Router();
const QualityManagement = require('../models/QualityManagement');
const auth = require('../middleware/auth');

// Get all quality checks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const qualityChecks = await QualityManagement.find({ project: req.params.projectId })
      .populate('auditedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalChecks = qualityChecks.length;
    const passedChecks = qualityChecks.filter(q => q.status === 'passed').length;
    const failedChecks = qualityChecks.filter(q => q.status === 'failed').length;
    const avgQualityScore = totalChecks > 0
      ? (qualityChecks.reduce((sum, q) => sum + (q.qualityScore || 0), 0) / totalChecks).toFixed(2)
      : 0;

    res.json({
      qualityChecks,
      statistics: {
        totalChecks,
        passedChecks,
        failedChecks,
        passRate: totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(2) : 0,
        avgQualityScore,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create quality check
router.post('/', auth, async (req, res) => {
  const qualityCheck = new QualityManagement({
    ...req.body,
    auditedBy: req.user.id,
  });

  try {
    const newCheck = await qualityCheck.save();
    await newCheck.populate(['auditedBy', 'approvedBy']);
    res.status(201).json(newCheck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update quality check
router.put('/:id', auth, async (req, res) => {
  try {
    const qualityCheck = await QualityManagement.findById(req.params.id);
    if (!qualityCheck) return res.status(404).json({ message: 'Quality check not found' });

    Object.assign(qualityCheck, req.body);
    qualityCheck.updatedAt = Date.now();

    const updatedCheck = await qualityCheck.save();
    await updatedCheck.populate(['auditedBy', 'approvedBy']);
    res.json(updatedCheck);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add quality issue
router.post('/:id/issues', auth, async (req, res) => {
  try {
    const qualityCheck = await QualityManagement.findById(req.params.id);
    if (!qualityCheck) return res.status(404).json({ message: 'Quality check not found' });

    const newIssue = {
      _id: require('mongoose').Types.ObjectId(),
      ...req.body,
    };

    qualityCheck.issues.push(newIssue);
    qualityCheck.updatedAt = Date.now();

    const updated = await qualityCheck.save();
    res.status(201).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve quality check
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const qualityCheck = await QualityManagement.findById(req.params.id);
    if (!qualityCheck) return res.status(404).json({ message: 'Quality check not found' });

    qualityCheck.status = req.body.status || 'passed';
    qualityCheck.approvedBy = req.user.id;
    qualityCheck.updatedAt = Date.now();

    const updated = await qualityCheck.save();
    await updated.populate(['auditedBy', 'approvedBy']);
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete quality check
router.delete('/:id', auth, async (req, res) => {
  try {
    const qualityCheck = await QualityManagement.findByIdAndDelete(req.params.id);
    if (!qualityCheck) return res.status(404).json({ message: 'Quality check not found' });
    res.json({ message: 'Quality check deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
