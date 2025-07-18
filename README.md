# Flowbit Multi-Tenant Workflow System

A comprehensive multi-tenant workflow system built with Node.js, React, MongoDB, and n8n integration. This system demonstrates tenant-aware authentication, RBAC, dynamic micro-frontends, and workflow automation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Shell    │    │  Support Tickets │    │      n8n        │
│  (Port 3000)    │    │   App (3002)     │    │  (Port 5678)    │
│                 │    │                  │    │                 │
│ • Authentication│    │ • Module Fed.    │    │ • Workflows     │
│ • Dynamic Nav   │    │ • Ticket UI      │    │ • Webhooks      │
│ • Tenant Aware  │    │ • Real-time      │    │ • Callbacks     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Node.js API   │
                    │   (Port 3001)   │
                    │                 │
                    │ • JWT Auth      │
                    │ • Tenant RBAC   │
                    │ • Audit Logs    │
                    │ • n8n Triggers  │
                    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │    MongoDB      │
                    │   (Port 27017)  │
                    │                 │
                    │ • Tenant Data   │
                    │ • Strict Isolation│
                    │ • Audit Trail   │
                    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- Git

### 1. Clone and Start
```bash
git clone <repository-url>
cd flowbit-system
docker-compose up -d
```

### 2. Test Users
The system is pre-seeded with test users:

**LogisticsCo:**
- Admin: `admin@logistics-co.com` / `password123`
- User: `user@logistics-co.com` / `password123`

**RetailGmbH:**
- Admin: `admin@retail-gmbh.com` / `password123`
- User: `user@retail-gmbh.com` / `password123`

### 3. Access Points
- **Frontend Shell**: http://localhost:3000
- **Support Tickets**: http://localhost:3002
- **API**: http://localhost:3001
- **n8n Dashboard**: http://localhost:5678 
- **MongoDB**: localhost:27017

## 🎯 Core Features

### ✅ R1: Authentication & RBAC
- JWT-based authentication with bcrypt password hashing
- Role-based access control (Admin/User)
- Middleware protection for admin routes (`/admin/*`)
- Tenant-aware JWT tokens with customerId

### ✅ R2: Tenant Data Isolation
- Every MongoDB collection includes `customerId` field
- Middleware ensures automatic tenant filtering
- Jest unit tests proving cross-tenant isolation
- Strict data boundaries between tenants

### ✅ R3: Use-Case Registry
- `registry.json` maps tenants to their screen configurations
- `/api/users/me/screens` endpoint returns tenant-specific screens
- Hard-coded configurations for LogisticsCo and RetailGmbH

### ✅ R4: Dynamic Navigation
- React shell fetches screens from API
- Sidebar dynamically renders based on tenant
- Webpack Module Federation for micro-frontend loading
- Lazy-loaded SupportTicketsApp component

### ✅ R5: Workflow Integration
- n8n container with pre-configured workflow
- POST `/api/tickets` triggers n8n workflow
- Webhook callbacks with shared secret verification
- Real-time UI updates via WebSocket/polling

### ✅ R6: Containerized Development
- Complete docker-compose setup
- MongoDB with initialization script
- n8n with workflow configurations
- ngrok for webhook testing
- Zero manual configuration required

## 🧪 Testing

### Run Unit Tests
```bash
# API tests (including tenant isolation)
cd api
npm test

# Specific tenant isolation test
npm test -- --testNamePattern="Tenant Data Isolation"
```

### Test Tenant Isolation
The system includes comprehensive Jest tests that verify:
- Admins cannot access other tenants' data
- API endpoints respect tenant boundaries
- Statistics are properly isolated
- Screen configurations are tenant-specific

### Manual Testing Workflow
1. Login as LogisticsCo admin
2. Create a support ticket
3. Observe n8n workflow execution
4. Check webhook callback and status update
5. Login as RetailGmbH admin
6. Verify you cannot see LogisticsCo data

## 📊 Demo Video Checklist

Your demo should show:
1. **Login** as both tenant admins
2. **Create tickets** in each tenant
3. **Workflow execution** in n8n dashboard
4. **Status updates** reflected in UI
5. **Tenant isolation** - prove LogisticsCo admin cannot see RetailGmbH data

## 🔧 Development

### Local Development (Without Docker)
```bash
# Start MongoDB
mongod

# Start API
cd api
npm install
npm run dev

# Start React Shell
cd shell
npm install
npm start

# Start Support Tickets App
cd support-tickets-app
npm install
npm start

# Start n8n
npx n8n
```

### Environment Variables
```env
# API (.env)
MONGODB_URI=mongodb://localhost:27017/flowbit
JWT_SECRET=your-super-secret-jwt-key
N8N_WEBHOOK_SECRET=n8n-webhook-secret-key
N8N_BASE_URL=http://localhost:5678

# React Apps
REACT_APP_API_URL=http://localhost:3001
```

## 🎨 Bonus Features

### ✨ Audit Logging
- Comprehensive audit trail for all actions
- Tracks user, tenant, timestamp, and details
- Admin dashboard shows recent activity
- Filterable audit logs

### ✨ Real-time Updates
- WebSocket integration for live updates
- Ticket status changes broadcast to UI
- Tenant-specific channels for isolation

### ✨ Responsive Design
- Mobile-friendly interface
- Styled-components for theming
- Professional UI with LogisticsCo/RetailGmbH branding

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Helmet**: Security headers
- **Input Validation**: express-validator for all inputs
- **CORS**: Configured for development/production

## 🔍 Monitoring & Debugging

### Logs
- API server logs all operations
- n8n execution logs
- MongoDB query logs
- Real-time WebSocket events

### Health Checks
- API health endpoint: `/health`
- MongoDB connection status
- n8n workflow status

## 📋 Known Limitations

1. **Local Development**: Docker networking may require host.docker.internal on some systems
2. **Webhook URLs**: ngrok token required for external webhooks
3. **Module Federation**: Simplified implementation for demo purposes
4. **Error Handling**: Basic error handling, production would need more robust error management

## 🏆 Success Criteria Met

✅ **R1**: JWT auth with role-based access control  
✅ **R2**: Strict tenant data isolation with tests  
✅ **R3**: Registry-based screen configuration  
✅ **R4**: Dynamic navigation with micro-frontends  
✅ **R5**: Complete n8n workflow integration  
✅ **R6**: Fully containerized development environment  

## 🚀 Next Steps

For production deployment:
1. Set up proper SSL certificates
2. Configure production MongoDB cluster
3. Implement proper secret management
4. Add comprehensive monitoring
5. Set up CI/CD pipeline
6. Add more comprehensive error handling

## 📧 Support

For questions or issues:
1. Check logs: `docker-compose logs <service>`
2. Verify all containers are running: `docker-compose ps`
3. Test API endpoints directly: `curl http://localhost:3001/health`

---

**Built with ❤️ for multi-tenant workflow automation**
