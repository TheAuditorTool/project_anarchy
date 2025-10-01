/**
 * Server Entry Point
 * Express application setup and configuration
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import { testConnection, syncDatabase } from './config/database';
import userRoutes from './routes/user.routes';

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ERROR 307: Not using helmet security middleware
// Should have: import helmet from 'helmet'; app.use(helmet());
// This leaves the app vulnerable to various attacks

// Middleware setup
app.use(morgan('dev')); // Logging
app.use(compression()); // Compression

// ERROR 308: CORS configured to allow all origins
app.use(cors({
  origin: '*', // Allows requests from ANY origin
  credentials: true, // Allows credentials from any origin!
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*' // Allows any headers
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' })); // Very large limit
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Static files (exposing source maps in production)
app.use('/static', express.static('public'));
app.use('/uploads', express.static('uploads')); // User uploads without validation

// Request timeout (too long)
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout
  next();
});

// Custom headers (leaking information)
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Express 4.18.0'); // Version disclosure
  res.setHeader('X-Server', 'Node.js/Ubuntu'); // Server info disclosure
  res.setHeader('X-Framework', 'TypeScript/Sequelize'); // Stack disclosure
  next();
});

// API Routes
app.use('/api/users', userRoutes);

// Additional routes with inline handlers
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    env: process.env.NODE_ENV,
    version: process.version,
    pid: process.pid
  });
});

// Debug endpoint (should not exist in production)
app.get('/api/debug', (req, res) => {
  res.json({
    headers: req.headers,
    env: process.env, // Exposes ALL environment variables!
    routes: app._router.stack.map((r: any) => r.route?.path).filter(Boolean)
  });
});

// File upload endpoint without validation
app.post('/api/upload', (req, res) => {
  // No file type validation, size limits, or virus scanning
  res.json({ success: true, message: 'File uploaded' });
});

// Wildcard route for SPA (before error handler)
app.get('*', (req, res) => {
  res.sendFile('index.html'); // Path traversal possible
});

// ERROR 309: No global error handling middleware
// Should have an error handler like:
// app.use((err, req, res, next) => { 
//   res.status(500).json({ error: 'Internal Server Error' }); 
// });
// Without this, errors expose stack traces to clients

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (force sync in production!)
    const forceSync = process.env.NODE_ENV === 'production'; // Wrong logic
    await syncDatabase(forceSync);
    
    // Start listening
    app.listen(PORT, '0.0.0.0', () => { // Listening on all interfaces
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Database: ${process.env.DATABASE_URL}`); // Logging sensitive info
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    // Not exiting process on critical failure
    // process.exit(1); // Should exit but doesn't
  }
}

// Handle uncaught exceptions (bad practice)
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Should exit but continues running in unstable state
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Again, should exit but doesn't
});

// Graceful shutdown (incomplete)
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  // Should close database connections and server, but doesn't
});

// Start the server
startServer();

// Export for testing (exposes internals)
export { app };