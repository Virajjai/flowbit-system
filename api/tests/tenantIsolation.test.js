const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');
const Ticket = require('../src/models/Ticket');

describe('Tenant Data Isolation', () => {
  let tenantAAdmin, tenantBAdmin, tenantAToken, tenantBToken;
  let tenantATicket, tenantBTicket;

  beforeAll(async () => {
    // Connect to test database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean up database
    await User.deleteMany({});
    await Ticket.deleteMany({});

    // Create test users for different tenants
    tenantAAdmin = await User.create({
      email: 'admin@logistics-co.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'LogisticsCo',
      customerId: 'logistics-co',
      role: 'Admin'
    });

    tenantBAdmin = await User.create({
      email: 'admin@retail-gmbh.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'RetailGmbH',
      customerId: 'retail-gmbh',
      role: 'Admin'
    });

    // Login both admins to get tokens
    const tenantALogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@logistics-co.com',
        password: 'password123'
      });

    const tenantBLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@retail-gmbh.com',
        password: 'password123'
      });

    tenantAToken = tenantALogin.body.token;
    tenantBToken = tenantBLogin.body.token;

    // Create tickets for both tenants
    tenantATicket = await Ticket.create({
      title: 'Tenant A Ticket',
      description: 'This is a ticket for Tenant A',
      customerId: 'logistics-co',
      userId: tenantAAdmin._id,
      priority: 'High'
    });

    tenantBTicket = await Ticket.create({
      title: 'Tenant B Ticket',
      description: 'This is a ticket for Tenant B',
      customerId: 'retail-gmbh',
      userId: tenantBAdmin._id,
      priority: 'Medium'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Ticket Access Control', () => {
    test('Admin from Tenant A cannot access Tenant B tickets', async () => {
      // Tenant A admin tries to access all tickets
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(1);
      expect(response.body.tickets[0].customerId).toBe('logistics-co');
      expect(response.body.tickets[0].title).toBe('Tenant A Ticket');
    });

    test('Admin from Tenant B cannot access Tenant A tickets', async () => {
      // Tenant B admin tries to access all tickets
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tickets).toHaveLength(1);
      expect(response.body.tickets[0].customerId).toBe('retail-gmbh');
      expect(response.body.tickets[0].title).toBe('Tenant B Ticket');
    });

    test('Admin from Tenant A cannot access specific Tenant B ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${tenantBTicket._id}`)
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Ticket not found');
    });

    test('Admin from Tenant B cannot access specific Tenant A ticket', async () => {
      const response = await request(app)
        .get(`/api/tickets/${tenantATicket._id}`)
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Ticket not found');
    });
  });

  describe('User Access Control', () => {
    test('Admin from Tenant A cannot access Tenant B users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tenantAToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].customerId).toBe('logistics-co');
      expect(response.body[0].email).toBe('admin@logistics-co.com');
    });

    test('Admin from Tenant B cannot access Tenant A users', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].customerId).toBe('retail-gmbh');
      expect(response.body[0].email).toBe('admin@retail-gmbh.com');
    });
  });

  describe('Statistics Isolation', () => {
    test('Admin stats are isolated by tenant', async () => {
      const tenantAStats = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${tenantAToken}`);

      const tenantBStats = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(tenantAStats.status).toBe(200);
      expect(tenantBStats.status).toBe(200);

      // Both should have 1 ticket and 1 user, but they should be different
      expect(tenantAStats.body.tickets.total).toBe(1);
      expect(tenantBStats.body.tickets.total).toBe(1);
      expect(tenantAStats.body.users.total).toBe(1);
      expect(tenantBStats.body.users.total).toBe(1);
    });
  });

  describe('Screen Registry Isolation', () => {
    test('Users get tenant-specific screens', async () => {
      const tenantAScreens = await request(app)
        .get('/api/users/me/screens')
        .set('Authorization', `Bearer ${tenantAToken}`);

      const tenantBScreens = await request(app)
        .get('/api/users/me/screens')
        .set('Authorization', `Bearer ${tenantBToken}`);

      expect(tenantAScreens.status).toBe(200);
      expect(tenantBScreens.status).toBe(200);

      expect(tenantAScreens.body.tenant.id).toBe('logistics-co');
      expect(tenantBScreens.body.tenant.id).toBe('retail-gmbh');

      // Both should have screens but different configurations
      expect(tenantAScreens.body.screens.length).toBeGreaterThan(0);
      expect(tenantBScreens.body.screens.length).toBeGreaterThan(0);
    });
  });
});
