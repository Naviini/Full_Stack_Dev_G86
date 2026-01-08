const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
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
    enum: ['human', 'equipment', 'material', 'software', 'facility', 'budget'],
    required: true,
  },
  category: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['available', 'allocated', 'in-use', 'unavailable', 'retired'],
    default: 'available',
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
  unit: {
    type: String,
    default: 'units',
  },
  costPerUnit: {
    type: Number,
    default: 0,
  },
  totalCost: {
    type: Number,
    default: 0,
  },
  allocationPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  // For human resources
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    default: '',
  },
  skills: [String],
  experience: {
    type: String,
    default: '',
  },
  availabilityStartDate: {
    type: Date,
  },
  availabilityEndDate: {
    type: Date,
  },
  hoursPerWeek: {
    type: Number,
    default: 40,
  },
  costPerHour: {
    type: Number,
    default: 0,
  },
  // For equipment/material resources
  location: {
    type: String,
    default: '',
  },
  supplier: {
    type: String,
    default: '',
  },
  partNumber: {
    type: String,
    default: '',
  },
  specifications: {
    type: String,
    default: '',
  },
  // Allocation details
  allocations: [{
    _id: mongoose.Schema.Types.ObjectId,
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    startDate: Date,
    endDate: Date,
    allocatedPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    allocatedQuantity: Number,
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  requiredSkills: [String],
  timeZone: {
    type: String,
    default: 'UTC',
  },
  notes: {
    type: String,
    default: '',
  },
  tags: [String],
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

module.exports = mongoose.model('Resource', ResourceSchema);
