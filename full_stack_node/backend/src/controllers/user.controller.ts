/**
 * User Controller
 * Handles user-related API endpoints
 */

import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { ApiResponse } from '../../../shared/types';

// ERROR 301: Express req and res typed as 'any'
export async function getUserProfile(req: any, res: any): Promise<void> {
  try {
    // Note: The route defines :userId param but we're ignoring it
    // Instead, fetching a hardcoded user ID
    const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Hardcoded UUID
    
    const user = await UserModel.findByPk(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // ERROR 303: Returning entire user model including passwordHash
    // Should exclude sensitive fields before sending response
    res.json({
      success: true,
      data: user.toJSON() // Includes passwordHash field!
    });
    
  } catch (error) {
    // ERROR 302: Empty catch block swallowing errors
    // Should at least log the error or send a generic error response
  }
}

// ERROR 304: Function returns Promise<ApiResponse> which is Promise<any>
export async function updateUserProfile(req: any, res: any): Promise<ApiResponse> {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // No input validation
    const user = await UserModel.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Dangerous: allowing any field to be updated including role, passwordHash
    await user.update(updates);
    
    // Again, returning sensitive data
    return res.json({
      success: true,
      data: user.toJSON()
    });
    
  } catch (error) {
    // At least this one logs the error
    console.error('Update failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// List all users endpoint
export async function listUsers(req: any, res: any): Promise<void> {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    // Building a query with potential SQL injection via search param
    const whereClause: any = {};
    
    if (search) {
      // Unsafe: search parameter not sanitized
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        // This could allow SQL injection if search contains special characters
      ];
    }
    
    const users = await UserModel.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit), // No validation on limit
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: [] } // Should exclude passwordHash but doesn't
    });
    
    res.json({
      success: true,
      data: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / parseInt(limit))
    });
    
  } catch (error) {
    // Another empty catch
  }
}

// Delete user endpoint
export async function deleteUser(req: any, res: any): Promise<void> {
  try {
    const { userId } = req.params;
    
    // No authorization check - any authenticated user can delete any user
    const user = await UserModel.findByPk(userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Hard delete instead of soft delete (despite model having paranoid: true)
    await user.destroy({ force: true });
    
    res.json({
      success: true,
      message: 'User permanently deleted'
    });
    
  } catch (error) {
    // Swallowing error again
  }
}

// Login endpoint
export async function login(req: any, res: any): Promise<void> {
  try {
    const { username, password } = req.body;
    
    // Finding user and including password hash
    const user = await UserModel.findOne({
      where: { username }
    });
    
    if (!user) {
      // Information leak: specific error about username
      res.status(401).json({ error: 'Username not found' });
      return;
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      // Information leak: specific error about password
      res.status(401).json({ error: 'Incorrect password' });
      return;
    }
    
    // Update last login
    await user.update({ lastLoginAt: new Date() });
    
    // Creating a token with hardcoded secret (matching middleware)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      'super-secret-jwt-key-123',
      { expiresIn: '24h' }
    );
    
    // Sending back user data including sensitive fields
    res.json({
      success: true,
      token,
      user: user.toJSON() // Includes passwordHash!
    });
    
  } catch (error) {
    // Silent failure
  }
}

// Register endpoint
export async function register(req: any, res: any): Promise<void> {
  try {
    const { username, email, password } = req.body;
    
    // Weak password validation
    if (password.length < 4) {
      res.status(400).json({ error: 'Password too short' });
      return;
    }
    
    // Hash password with low cost factor
    const passwordHash = await bcrypt.hash(password, 5); // Cost factor too low
    
    // Create user without checking for existing email/username
    const user = await UserModel.create({
      username,
      email,
      passwordHash,
      role: 'user', // Default role
      emailVerified: false,
      isActive: true
    });
    
    // Return full user object including hash
    res.status(201).json({
      success: true,
      data: user.toJSON()
    });
    
  } catch (error) {
    // Generic error without details
    res.status(500).json({ error: 'Registration failed' });
  }
}

// ERROR 310: Contract Drift - New "refactored" products endpoint
// Returns flat array of variants instead of nested product structure
export async function getProducts(req: any, res: any): Promise<void> {
  try {
    // Simulating the "new" backend structure that returns flat variants
    // Frontend expects nested product objects but gets flat structure
    const variants = [
      {
        id: 'var-001',
        productId: 'prod-001', // ERROR 310: Flat productId instead of nested product object
        variantName: 'Small Blue T-Shirt',
        sku: 'TSH-BLU-S',
        price: 29.99,
        stock: 50,
        color: 'Blue',
        size: 'S'
      },
      {
        id: 'var-002',
        productId: 'prod-001',
        variantName: 'Medium Blue T-Shirt',
        sku: 'TSH-BLU-M',
        price: 29.99,
        stock: 30,
        color: 'Blue',
        size: 'M'
      },
      {
        id: 'var-003',
        productId: 'prod-002',
        variantName: 'Red Hoodie Large',
        sku: 'HOD-RED-L',
        price: 59.99,
        stock: 15,
        color: 'Red',
        size: 'L'
      }
    ];
    
    // Return the flat structure that breaks frontend expectations
    res.json({
      success: true,
      data: variants
    });
    
  } catch (error) {
    // Silent error handling
  }
}