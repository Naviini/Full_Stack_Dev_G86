const mongoose = require('mongoose');

const QualityManagementSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  checklistItem: {
    name: String,
    description: String,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  standards: {
    category: {
      type: String,
      enum: ['functionality', 'performance', 'reliability', 'usability', 'security', 'documentation'],
    },
    description: String,
    acceptance: String, // Acceptance criteria
    result: {
      type: String,
      enum: ['passed', 'failed', 'pending'],
      default: 'pending',
    },
    evidence: String,
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  issues: [{
    _id: mongoose.Schema.Types.ObjectId,
    severity: {
      type: String,
      enum: ['critical', 'major', 'minor'],
      default: 'minor',
    },
    description: String,
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved'],
      default: 'open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: Date,
    resolution: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  auditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  auditDate: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['in-progress', 'passed', 'failed', 'conditional-pass'],
    default: 'in-progress',
  },
  comments: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('QualityManagement', QualityManagementSchema);
