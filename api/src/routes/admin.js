const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireAdmin, ensureTenantIsolation, auditLogger } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authenticateToken);
router.use(requireAdmin);
router.use(ensureTenantIsolation);

// Get all users for current tenant
router.get('/users', async (req, res) => {
  try {
    const { customerId } = req.user;
    const users = await User.find({ customerId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create new user
router.post('/users', auditLogger('create_user', 'user'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, role = 'User' } = req.body;
    const { customerId } = req.user;

    // Check if user already exists
    const existingUser = await User.findOne({ email, customerId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      customerId,
      role
    });

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', auditLogger('update_user', 'user'), async (req, res) => {
  try {
    const { customerId } = req.user;
    const updates = req.body;

    // Remove password from updates if present (should be handled separately)
    delete updates.password;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, customerId },
      updates,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', auditLogger('delete_user', 'user'), async (req, res) => {
  try {
    const { customerId } = req.user;
    
    // Don't allow admin to delete themselves
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findOneAndDelete({ _id: req.params.id, customerId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get tenant statistics
router.get('/stats', async (req, res) => {
  try {
    const { customerId } = req.user;

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      totalUsers,
      activeUsers
    ] = await Promise.all([
      Ticket.countDocuments({ customerId }),
      Ticket.countDocuments({ customerId, status: 'Open' }),
      Ticket.countDocuments({ customerId, status: 'Resolved' }),
      User.countDocuments({ customerId }),
      User.countDocuments({ customerId, isActive: true })
    ]);

    // Get ticket distribution by priority
    const ticketsByPriority = await Ticket.aggregate([
      { $match: { customerId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get recent activity
    const recentActivity = await AuditLog.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'firstName lastName email');

    res.json({
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        byPriority: ticketsByPriority
      },
      users: {
        total: totalUsers,
        active: activeUsers
      },
      recentActivity
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { customerId } = req.user;
    const { page = 1, limit = 20, action, resourceType } = req.query;

    const filter = { customerId };
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;

    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

module.exports = router;
