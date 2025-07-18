const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true
  }],
  workflowId: {
    type: String, // n8n workflow execution ID
    default: null
  },
  workflowStatus: {
    type: String,
    enum: ['Pending', 'Running', 'Completed', 'Failed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

// Create compound index for customerId and other frequent queries
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ customerId: 1, userId: 1 });
ticketSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
