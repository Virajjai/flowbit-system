const express = require('express');
const { authenticateToken, ensureTenantIsolation } = require('../middleware/auth');
const registryConfig = require('../config/registry.json');

const router = express.Router();

// Get screens for current user's tenant
router.get('/me/screens', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.user;
    
    // Get screens from registry based on tenant
    const tenantConfig = registryConfig.tenants[customerId];
    
    if (!tenantConfig) {
      return res.status(404).json({ error: 'Tenant configuration not found' });
    }

    const screens = tenantConfig.screens || [];
    
    res.json({
      screens,
      tenant: {
        id: customerId,
        name: tenantConfig.name
      }
    });
  } catch (error) {
    console.error('Get screens error:', error);
    res.status(500).json({ error: 'Failed to get screens' });
  }
});

// Get current user profile (alternative endpoint)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      customerId: req.user.customerId,
      firstName: req.user.firstName,
      lastName: req.user.lastName
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

module.exports = router;
