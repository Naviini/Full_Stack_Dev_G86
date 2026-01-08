const mongoose = require('mongoose');

const ScopeSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  deliverables: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'on-hold'],
      default: 'pending',
    },
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  constraints: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['schedule', 'budget', 'resource', 'technical', 'organizational'],
      default: 'schedule',
    },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    mitigation: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  assumptions: [{
    _id: mongoose.Schema.Types.ObjectId,
    statement: String,
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  exclusions: [{
    _id: mongoose.Schema.Types.ObjectId,
    item: String,
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  inclusions: [{
    _id: mongoose.Schema.Types.ObjectId,
    item: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  requirements: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['functional', 'non-functional', 'technical', 'business'],
      default: 'functional',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['identified', 'approved', 'implemented'],
      default: 'identified',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  scopeStatement: {
    type: String,
    default: '',
  },
  baselineDate: {
    type: Date,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  changeHistory: [{
    date: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changeDescription: String,
    impact: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Scope', ScopeSchema);
