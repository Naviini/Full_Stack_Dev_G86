const mongoose = require('mongoose');

const PlanningSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['project-charter', 'scope-statement', 'schedule-baseline', 'budget-baseline', 'quality-plan', 'risk-register', 'communication-plan', 'stakeholder-analysis', 'resource-plan', 'change-management-plan'],
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'in-review', 'approved', 'implemented', 'archived'],
    default: 'draft',
  },
  lifecycle: {
    initiation: {
      completed: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
    planning: {
      completed: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
    execution: {
      completed: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
    monitoring: {
      completed: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
    closure: {
      completed: { type: Boolean, default: false },
      date: Date,
      notes: String,
    },
  },
  objectives: [{
    goal: String,
    metrics: String,
    target: String,
    trackingMethod: String,
  }],
  scope: {
    inclusions: [String],
    exclusions: [String],
    constraints: [String],
    assumptions: [String],
  },
  timeline: {
    phases: [{
      name: String,
      startDate: Date,
      endDate: Date,
      duration: Number, // in days
      dependencies: [String],
    }],
  },
  risks: [{
    description: String,
    probability: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    mitigation: String,
  }],
  stakeholders: [{
    name: String,
    role: String,
    interest: String,
    engagement: {
      type: String,
      enum: ['manage-closely', 'keep-satisfied', 'monitor', 'keep-informed'],
    },
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  document: {
    filename: String,
    url: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Planning', PlanningSchema);
