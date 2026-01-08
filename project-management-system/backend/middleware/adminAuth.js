const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Get user from auth middleware (should already be set)
    if (!req.user || !req.user.user || !req.user.user.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch user from database to get role
    const user = await User.findById(req.user.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }

    // Attach user to request for later use
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = adminAuth;
