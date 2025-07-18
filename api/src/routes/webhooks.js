const express = require('express');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Webhook endpoint for n8n workflow completion
router.post('/ticket-done', async (req, res) => {
  try {
    // Verify shared secret
    const providedSecret = req.headers['x-n8n-webhook-secret'];
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId, customerId, status = 'Resolved', workflowId } = req.body;

    if (!ticketId || !customerId) {
      return res.status(400).json({ error: 'Missing required fields: ticketId, customerId' });
    }

    // Find and update ticket
    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, customerId },
      { 
        status,
        workflowStatus: 'Completed',
        workflowId: workflowId || null
      },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!ticket) {
      console.error('Ticket not found:', ticketId, customerId);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Log the webhook action
    try {
      await AuditLog.create({
        action: 'workflow_completed',
        userId: ticket.userId._id,
        customerId: ticket.customerId,
        resourceType: 'workflow',
        resourceId: ticketId,
        details: {
          workflowId,
          previousStatus: ticket.status,
          newStatus: status,
          source: 'n8n_webhook'
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'n8n-webhook'
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    // Emit real-time update to frontend
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant-${customerId}`).emit('ticket-workflow-completed', {
        ticket,
        workflowId,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Workflow completed for ticket ${ticketId} (${customerId})`);

    res.json({ 
      success: true, 
      ticket: {
        id: ticket._id,
        status: ticket.status,
        workflowStatus: ticket.workflowStatus
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Webhook endpoint for n8n workflow failure
router.post('/ticket-failed', async (req, res) => {
  try {
    // Verify shared secret
    const providedSecret = req.headers['x-n8n-webhook-secret'];
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET;

    if (!providedSecret || providedSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticketId, customerId, error: workflowError, workflowId } = req.body;

    if (!ticketId || !customerId) {
      return res.status(400).json({ error: 'Missing required fields: ticketId, customerId' });
    }

    // Find and update ticket
    const ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, customerId },
      { 
        workflowStatus: 'Failed',
        workflowId: workflowId || null
      },
      { new: true }
    ).populate('userId', 'firstName lastName email');

    if (!ticket) {
      console.error('Ticket not found:', ticketId, customerId);
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Log the webhook action
    try {
      await AuditLog.create({
        action: 'workflow_failed',
        userId: ticket.userId._id,
        customerId: ticket.customerId,
        resourceType: 'workflow',
        resourceId: ticketId,
        details: {
          workflowId,
          error: workflowError,
          source: 'n8n_webhook'
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'n8n-webhook'
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }

    // Emit real-time update to frontend
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant-${customerId}`).emit('ticket-workflow-failed', {
        ticket,
        workflowId,
        error: workflowError,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Workflow failed for ticket ${ticketId} (${customerId}):`, workflowError);

    res.json({ 
      success: true, 
      ticket: {
        id: ticket._id,
        status: ticket.status,
        workflowStatus: ticket.workflowStatus
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
