const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      customerId: decoded.customerId,
      role: decoded.role,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `${requiredRole} role required` });
    }

    next();
  };
};

const requireAdmin = requireRole('Admin');

// Middleware to ensure tenant isolation
const ensureTenantIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Store original query method
  const originalQuery = req.query;
  
  // Add customerId filter to all queries
  req.query = {
    ...originalQuery,
    customerId: req.user.customerId
  };

  next();
};

// Audit logging middleware
const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log successful actions
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await AuditLog.create({
              action,
              userId: req.user.userId,
              customerId: req.user.customerId,
              resourceType,
              resourceId: req.params.id || 'unknown',
              details: {
                method: req.method,
                url: req.url,
                body: req.body,
                statusCode: res.statusCode
              },
              ipAddress: req.ip || req.connection.remoteAddress,
              userAgent: req.get('User-Agent') || 'unknown'
            });
          } catch (error) {
            console.error('Audit log error:', error);
          }
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  ensureTenantIsolation,
  auditLogger
};
