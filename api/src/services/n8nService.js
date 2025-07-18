const axios = require('axios');

class N8nService {
  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || 'n8n-webhook-secret-key';
    this.credentials = {
      username: 'admin',
      password: 'password'
    };
  }

  async triggerWorkflow(ticket) {
    try {
      const workflowData = {
        ticketId: ticket._id.toString(),
        customerId: ticket.customerId,
        title: ticket.title,
        description: ticket.description,
        priority: ticket.priority,
        status: ticket.status,
        userId: ticket.userId.toString(),
        createdAt: ticket.createdAt,
        webhookUrl: this.getWebhookUrl()
      };

      console.log('Triggering n8n workflow for ticket:', ticket._id);

      // Use webhook trigger URL for the workflow
      const webhookUrl = `${this.baseUrl}/webhook-test/ticket-processing`;
      
      const response = await axios.post(webhookUrl, workflowData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': this.webhookSecret
        },
        timeout: 10000
      });

      console.log('n8n workflow triggered successfully:', response.data);

      return {
        success: true,
        executionId: response.data.executionId || `exec_${Date.now()}`,
        data: response.data
      };
    } catch (error) {
      console.error('Error triggering n8n workflow:', error.message);
      
      // Return failure but don't throw - let the ticket creation continue
      return {
        success: false,
        error: error.message,
        executionId: null
      };
    }
  }

  getWebhookUrl() {
    // In production, this would be the public URL exposed by ngrok or similar
    // For development, we'll use localhost with the expected API endpoint
    return `${process.env.API_BASE_URL || 'http://localhost:3001'}/webhook/ticket-done`;
  }

  async getWorkflowStatus(executionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        auth: this.credentials,
        timeout: 5000
      });

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting workflow status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async cancelWorkflow(executionId) {
    try {
      const response = await axios.delete(`${this.baseUrl}/api/v1/executions/${executionId}/stop`, {
        auth: this.credentials,
        timeout: 5000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error cancelling workflow:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new N8nService();
