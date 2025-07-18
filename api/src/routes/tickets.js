const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const { authenticateToken, ensureTenantIsolation, auditLogger } = require('../middleware/auth');
const n8nService = require('../services/n8nService');

const router = express.Router();

// Apply authentication and tenant isolation to all routes
router.use(authenticateToken);
router.use(ensureTenantIsolation);

// Get all tickets for current tenant
router.get('/', async (req, res) => {
  try {
    const { customerId } = req.user;
    const { status, priority, page = 1, limit = 10 } = req.query;

    const filter = { customerId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tickets = await Ticket.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Ticket.countDocuments(filter);

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Failed to get tickets' });
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const { customerId } = req.user;
    const ticket = await Ticket.findOne({ _id: req.params.id, customerId })
      .populate('userId', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

// Create new ticket
router.post('/', [
  body('title').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('tags').optional().isArray()
], auditLogger('create_ticket', 'ticket'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority = 'Medium', tags = [] } = req.body;
    const { customerId, userId } = req.user;

    // Create ticket
    const ticket = new Ticket({
      title,
      description,
      priority,
      tags,
      customerId,
      userId
    });

    await ticket.save();

    // Trigger n8n workflow
    try {
      const workflowResponse = await n8nService.triggerWorkflow(ticket);
      if (workflowResponse.success) {
        ticket.workflowId = workflowResponse.executionId;
        ticket.workflowStatus = 'Running';
        await ticket.save();
      }
    } catch (workflowError) {
      console.error('Workflow trigger error:', workflowError);
      // Continue even if workflow fails
    }

    // Populate user info for response
    await ticket.populate('userId', 'firstName lastName email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`tenant-${customerId}`).emit('ticket-created', ticket);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Update ticket
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim().isLength({ min: 1 }),
  body('status').optional().isIn(['Open', 'In Progress', 'Resolved', 'Closed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  body('tags').optional().isArray()
], auditLogger('update_ticket', 'ticket'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId } = req.user;
    const updates = req.body;

    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, customerId },
      updates,
      { new: true }
    ).populate('userId', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`tenant-${customerId}`).emit('ticket-updated', ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete ticket
router.delete('/:id', auditLogger('delete_ticket', 'ticket'), async (req, res) => {
  try {
    const { customerId } = req.user;
    const ticket = await Ticket.findOneAndDelete({ _id: req.params.id, customerId });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`tenant-${customerId}`).emit('ticket-deleted', { id: ticket._id });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

module.exports = router;
