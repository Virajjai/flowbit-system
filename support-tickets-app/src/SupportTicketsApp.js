import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #264653;
  margin-bottom: 0.5rem;
`;

const Description = styled.p`
  color: #6c757d;
  margin-bottom: 1rem;
`;

const CreateTicketForm = styled.form`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button`
  background-color: #2a9d8f;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #21867a;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TicketList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const TicketItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TicketTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #264653;
`;

const TicketMeta = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${props => {
    switch(props.status) {
      case 'Open':
        return 'background-color: #d4edda; color: #155724;';
      case 'In Progress':
        return 'background-color: #fff3cd; color: #856404;';
      case 'Resolved':
        return 'background-color: #d1ecf1; color: #0c5460;';
      default:
        return 'background-color: #f8f9fa; color: #6c757d;';
    }
  }}
`;

const SupportTicketsApp = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium'
  });

  // Mock data for demo
  useEffect(() => {
    const mockTickets = [
      {
        id: '1',
        title: 'Unable to login to system',
        description: 'Getting error when trying to log in',
        priority: 'High',
        status: 'Open',
        createdAt: new Date().toISOString(),
        workflowStatus: 'Pending'
      },
      {
        id: '2',
        title: 'Feature request for reporting',
        description: 'Need additional reporting capabilities',
        priority: 'Medium',
        status: 'In Progress',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        workflowStatus: 'Running'
      }
    ];
    setTickets(mockTickets);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Make API call to create ticket
      const response = await fetch('http://localhost:3001/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      
      const newTicket = await response.json();
      
      // Add ticket to list
      setTickets([newTicket, ...tickets]);
      setFormData({ title: '', description: '', priority: 'Medium' });
      
      alert('Ticket created successfully! n8n workflow has been triggered.');
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Error creating ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Support Tickets</Title>
        <Description>
          Create and manage support tickets. This micro-frontend demonstrates 
          dynamic loading and tenant-specific functionality.
        </Description>
      </Header>
      
      <CreateTicketForm onSubmit={handleSubmit}>
        <h2>Create New Ticket</h2>
        
        <FormGroup>
          <Label>Title</Label>
          <Input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Brief description of the issue"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Description</Label>
          <TextArea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Detailed description of the issue"
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Priority</Label>
          <Select
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </Select>
        </FormGroup>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Ticket'}
        </Button>
      </CreateTicketForm>
      
      <TicketList>
        <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h2>Your Tickets</h2>
        </div>
        
        {tickets.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
            No tickets found. Create your first ticket above.
          </div>
        ) : (
          tickets.map(ticket => (
            <TicketItem key={ticket.id}>
              <TicketTitle>{ticket.title}</TicketTitle>
              <TicketMeta>
                <StatusBadge status={ticket.status}>{ticket.status}</StatusBadge>
                <span>Priority: {ticket.priority}</span>
                <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                <span>Workflow: {ticket.workflowStatus}</span>
              </TicketMeta>
              <p>{ticket.description}</p>
            </TicketItem>
          ))
        )}
      </TicketList>
    </Container>
  );
};

export default SupportTicketsApp;
