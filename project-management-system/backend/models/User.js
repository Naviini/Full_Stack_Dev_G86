const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not using Google OAuth
    },
  },
  googleId: {
    type: String,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'team-member', 'client'],
    default: 'team-member',
  },
  avatar: {
    type: String,
    default: null,
  },
  department: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  totalHoursLogged: {
    type: Number,
    default: 0,
  },
  permissions: {
    canCreateProjects: {
      type: Boolean,
      default: false,
    },
    canDeleteProjects: {
      type: Boolean,
      default: false,
    },
    canAssignTasks: {
      type: Boolean,
      default: false,
    },
    canEditBudget: {
      type: Boolean,
      default: false,
    },
    canViewAnalytics: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Set permissions based on role
UserSchema.pre('save', function(next) {
  if (this.role === 'admin') {
    this.permissions = {
      canCreateProjects: true,
      canDeleteProjects: true,
      canAssignTasks: true,
      canEditBudget: true,
      canViewAnalytics: true,
    };
  } else if (this.role === 'manager') {
    this.permissions = {
      canCreateProjects: true,
      canDeleteProjects: false,
      canAssignTasks: true,
      canEditBudget: true,
      canViewAnalytics: true,
    };
  } else if (this.role === 'team-member') {
    this.permissions = {
      canCreateProjects: false,
      canDeleteProjects: false,
      canAssignTasks: false,
      canEditBudget: false,
      canViewAnalytics: false,
    };
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
