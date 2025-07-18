// MongoDB initialization script
print('Starting MongoDB initialization...');

// Switch to the flowbit database
db = db.getSiblingDB('flowbit');

// Create the users collection with initial data
print('Creating users...');

// LogisticsCo Admin
db.users.insertOne({
  email: 'admin@logistics-co.com',
  password: '$2a$10$7wCr/4Ie8H7iWECauc4jOuo2Dn/knLt2TjedxT8yfhfwPHDANwQPq', // pre-hashed password123
  firstName: 'John',
  lastName: 'Admin',
  customerId: 'logistics-co',
  role: 'Admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// RetailGmbH Admin
db.users.insertOne({
  email: 'admin@retail-gmbh.com',
  password: '$2a$10$7wCr/4Ie8H7iWECauc4jOuo2Dn/knLt2TjedxT8yfhfwPHDANwQPq', // pre-hashed password123
  firstName: 'Maria',
  lastName: 'Admin',
  customerId: 'retail-gmbh',
  role: 'Admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// LogisticsCo User
db.users.insertOne({
  email: 'user@logistics-co.com',
  password: '$2a$10$7wCr/4Ie8H7iWECauc4jOuo2Dn/knLt2TjedxT8yfhfwPHDANwQPq', // pre-hashed password123
  firstName: 'Alice',
  lastName: 'Smith',
  customerId: 'logistics-co',
  role: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// RetailGmbH User
db.users.insertOne({
  email: 'user@retail-gmbh.com',
  password: '$2a$10$7wCr/4Ie8H7iWECauc4jOuo2Dn/knLt2TjedxT8yfhfwPHDANwQPq', // pre-hashed password123
  firstName: 'Bob',
  lastName: 'Johnson',
  customerId: 'retail-gmbh',
  role: 'User',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Created users successfully');

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ email: 1, customerId: 1 }, { unique: true });
db.users.createIndex({ customerId: 1 });
db.users.createIndex({ role: 1 });

// Tickets collection indexes (for when tickets are created)
db.tickets.createIndex({ customerId: 1, status: 1 });
db.tickets.createIndex({ customerId: 1, userId: 1 });
db.tickets.createIndex({ customerId: 1, createdAt: -1 });

// Audit logs collection indexes
db.auditlogs.createIndex({ customerId: 1, createdAt: -1 });
db.auditlogs.createIndex({ userId: 1, createdAt: -1 });

print('Created indexes successfully');

print('MongoDB initialization completed successfully!');
print('');
print('Test Users Created:');
print('- LogisticsCo Admin: admin@logistics-co.com / password123');
print('- RetailGmbH Admin: admin@retail-gmbh.com / password123');
print('- LogisticsCo User: user@logistics-co.com / password123');
print('- RetailGmbH User: user@retail-gmbh.com / password123');
print('');
