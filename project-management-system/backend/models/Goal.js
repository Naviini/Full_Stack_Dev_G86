const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['strategic', 'operational', 'milestone-based'],
    default: 'strategic',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'on-hold', 'cancelled'],
    default: 'not-started',
  },
  measurable: {
    type: Boolean,
    default: true,
  },
  targetValue: {
    type: String,
    default: '',
  },
  currentValue: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  completedDate: {
    type: Date,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  relatedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  }],
  keyResults: [{
    _id: mongoose.Schema.Types.ObjectId,
    title: String,
    targetValue: String,
    currentValue: String,
    weight: {
      type: Number,
      default: 25,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
  }],
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
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

module.exports = mongoose.model('Goal', GoalSchema);
