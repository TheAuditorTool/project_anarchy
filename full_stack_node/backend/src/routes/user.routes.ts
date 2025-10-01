/**
 * User Routes
 * Defines API endpoints for user management
 */

import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware, authorize, rateLimitMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/register', userController.register);
router.post('/login', userController.login);

// ERROR 305: Applying flawed auth middleware from auth.middleware.ts
// This middleware has the hardcoded 'master-key' bypass vulnerability
router.use(authMiddleware);

// Protected routes

// ERROR 306: Route defines :userId parameter but controller ignores it
// The getUserProfile function uses a hardcoded userId instead
router.get('/:userId/profile', userController.getUserProfile);

// Update user profile - only user themselves or admin
router.put('/:userId/profile', userController.updateUserProfile);

// Admin-only routes
router.use(authorize('admin')); // Using the flawed authorize middleware

// List all users (admin only)
router.get('/', rateLimitMiddleware, userController.listUsers);

// Delete user (admin only)
router.delete('/:userId', userController.deleteUser);

// Additional routes that look normal but interact with flawed handlers

// Get user by username (public info only)
router.get('/username/:username', async (req, res) => {
  // Inline handler with poor error handling
  try {
    const { UserModel } = require('../models/user.model');
    const user = await UserModel.findOne({
      where: { username: req.params.username },
      attributes: ['id', 'username', 'profilePicture', 'bio']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    // Silent error
  }
});

// Bulk operations endpoint (dangerous)
router.post('/bulk', async (req, res) => {
  const { action, userIds } = req.body;
  
  // No validation on action or userIds
  if (action === 'delete') {
    const { UserModel } = require('../models/user.model');
    await UserModel.destroy({
      where: { id: userIds }
    });
    res.json({ success: true, message: `Deleted ${userIds.length} users` });
  } else if (action === 'activate') {
    const { UserModel } = require('../models/user.model');
    await UserModel.update(
      { isActive: true },
      { where: { id: userIds } }
    );
    res.json({ success: true, message: `Activated ${userIds.length} users` });
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
});

// Password reset endpoint (insecure)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  
  // No verification of user identity!
  const { UserModel } = require('../models/user.model');
  const bcrypt = require('bcrypt');
  
  const user = await UserModel.findOne({ where: { email } });
  if (user) {
    const passwordHash = await bcrypt.hash(newPassword, 5); // Low cost factor
    await user.update({ passwordHash });
    res.json({ success: true, message: 'Password updated' });
  } else {
    // Information leak about email existence
    res.status(404).json({ error: 'Email not found' });
  }
});

// Export routes (additional middleware can be attached)
router.get('/export', async (req, res) => {
  // Exports all user data without pagination
  const { UserModel } = require('../models/user.model');
  const users = await UserModel.findAll();
  
  res.json({
    success: true,
    data: users.map(u => u.toJSON()), // Includes sensitive data
    exportedAt: new Date()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  // Leaks internal information
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    database: process.env.DATABASE_URL // Leaking connection string!
  });
});

export default router;