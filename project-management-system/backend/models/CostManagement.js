const mongoose = require('mongoose');

const CostManagementSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  budgetCategory: {
    type: String,
    enum: ['personnel', 'equipment', 'materials', 'software', 'services', 'contingency', 'other'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  estimatedCost: {
    type: Number,
    required: true,
    default: 0,
  },
  actualCost: {
    type: Number,
    default: 0,
  },
  variance: {
    type: Number,
    default: 0, // actualCost - estimatedCost
  },
  status: {
    type: String,
    enum: ['planned', 'approved', 'committed', 'spent', 'closed'],
    default: 'planned',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: Date,
  dueDate: Date,
  notes: String,
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

module.exports = mongoose.model('CostManagement', CostManagementSchema);
