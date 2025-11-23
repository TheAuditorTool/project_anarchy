/**
 * Project Anarchy - Unified API Gateway
 *
 * This gateway routes frontend requests to the appropriate backend services,
 * creating real cross-boundary data flows for taint analysis testing.
 *
 * ARCHITECTURE:
 * ┌─────────────┐     HTTP      ┌──────────────────────────────────────────────┐
 * │  frontend/  │ ────────────▶ │              GATEWAY (:4000)                 │
 * │   (:3000)   │               │                                              │
 * └─────────────┘               │  /api/users/*        → api/ (FastAPI :8000)  │
 *                               │  /api/pipeline/*     → python_pipeline/(:8001)│
 *                               │  /api/rust/*         → rust_backend/ (:8080) │
 *                               │  /api/search/*       → rust_backend/ (:8080) │
 *                               └──────────────────────────────────────────────┘
 *
 * TAINT FLOWS:
 * 1. User Input → Gateway → Python API → Database (SQL Injection)
 * 2. User Input → Gateway → Rust Backend → File System (Path Traversal)
 * 3. User Input → Gateway → Pipeline → External Services (SSRF)
 *
 * INTENTIONAL VULNERABILITIES IN THIS FILE:
 * - Forwarding unvalidated user input to backend services
 * - No rate limiting on sensitive endpoints
 * - Overly permissive CORS in development
 * - Logging sensitive data
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

// -----------------------------------------------------------------------------
// Service URLs - These connect to the existing project components
// -----------------------------------------------------------------------------
const SERVICES = {
  // api/ folder - Python FastAPI (the main API with SQL injection, auth bypass, etc.)
  pythonApi: process.env.PYTHON_API_URL || 'http://localhost:8000',

  // python_pipeline/ - Data processing service (CSV import, batch processing)
  pipeline: process.env.PIPELINE_URL || 'http://localhost:8001',

  // rust_backend/ - Performance-critical operations (search, file ops, calc)
  rustBackend: process.env.RUST_BACKEND_URL || 'http://localhost:8080',
};

// -----------------------------------------------------------------------------
// Middleware Setup
// -----------------------------------------------------------------------------

// VULN: Helmet disabled in dev mode - exposes security headers issues
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
}

// VULN: Overly permissive CORS - allows any origin
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// VULN: Logging includes potentially sensitive data
app.use(morgan(':method :url :status :response-time ms - :req[authorization]'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware for tracing
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// -----------------------------------------------------------------------------
// ROUTE GROUP 1: Python API Routes (api/ folder)
// Handles: User management, authentication, data operations
// TAINT: User input flows to Python FastAPI with SQL injection vulnerabilities
// -----------------------------------------------------------------------------

// Proxy to api/app.py - Status endpoint
app.get('/api/users/:userId/status', async (req, res) => {
  try {
    // TAINT: userId flows directly to Python API (potential SQL injection in db.py)
    const response = await axios.get(
      `${SERVICES.pythonApi}/status/${req.params.userId}`
    );
    res.json(response.data);
  } catch (error) {
    // VULN: Leaking internal error details
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
      service: 'python-api',
      requestId: req.requestId,
    });
  }
});

// Proxy to api/app.py - Process endpoint
app.post('/api/users/:userId/process', async (req, res) => {
  try {
    // TAINT: userId and body flow to Python API
    const response = await axios.post(
      `${SERVICES.pythonApi}/process`,
      { user_id: req.params.userId, ...req.body }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
      service: 'python-api',
    });
  }
});

// Proxy to api/db.py functions via new endpoint
app.get('/api/users/search', async (req, res) => {
  try {
    // TAINT: query.username flows to db.py get_user_by_username (SQL INJECTION!)
    // This connects frontend → gateway → api/db.py SQL injection vulnerability
    const response = await axios.get(
      `${SERVICES.pythonApi}/users/search`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// Proxy to api/auth_service.py
app.post('/api/auth/login', async (req, res) => {
  try {
    // TAINT: credentials flow to auth_service.py (race condition, plaintext passwords)
    const response = await axios.post(
      `${SERVICES.pythonApi}/auth/login`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// Proxy to api/secure_routes.py - Admin endpoint
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    // TAINT: Authorization header flows to secure_routes.py (JWT validation skip!)
    const response = await axios.get(
      `${SERVICES.pythonApi}/admin/dashboard`,
      { headers: { Authorization: req.headers.authorization || '' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// -----------------------------------------------------------------------------
// ROUTE GROUP 2: Python Pipeline Routes (python_pipeline/ folder)
// Handles: Data ingestion, batch processing, transactions
// TAINT: User input flows to pipeline with eval() vulnerability
// -----------------------------------------------------------------------------

app.post('/api/pipeline/users/:userId/process', async (req, res) => {
  try {
    // TAINT: userId flows to python_pipeline/api/fastapi_endpoint.py
    const response = await axios.post(
      `${SERVICES.pipeline}/users/${req.params.userId}/process`,
      req.body,
      { headers: { Authorization: req.headers.authorization || '' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
      service: 'pipeline',
    });
  }
});

app.post('/api/pipeline/batch/process', async (req, res) => {
  try {
    // TAINT: user_ids array flows to batch processor
    const response = await axios.post(
      `${SERVICES.pipeline}/batch/process`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.post('/api/pipeline/import/csv', async (req, res) => {
  try {
    // TAINT: file_path flows to data_ingestion.py with eval() vulnerability!
    const response = await axios.post(
      `${SERVICES.pipeline}/import/csv`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.get('/api/pipeline/transactions/:userId', async (req, res) => {
  try {
    // TAINT: userId flows to transaction query (no auth check - IDOR)
    const response = await axios.get(
      `${SERVICES.pipeline}/transactions/${req.params.userId}`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// -----------------------------------------------------------------------------
// ROUTE GROUP 3: Rust Backend Routes (rust_backend/ folder)
// Handles: Performance-critical operations, search, file operations
// TAINT: User input flows to Rust with command injection, path traversal
// -----------------------------------------------------------------------------

app.get('/api/search/users', async (req, res) => {
  try {
    // TAINT: query.q flows to rust_backend SQL injection vulnerability!
    const response = await axios.get(
      `${SERVICES.rustBackend}/api/users/search`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
      service: 'rust-backend',
    });
  }
});

app.get('/api/files/read', async (req, res) => {
  try {
    // TAINT: query.path flows to rust_backend path traversal vulnerability!
    const response = await axios.get(
      `${SERVICES.rustBackend}/api/files/read`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.post('/api/exec', async (req, res) => {
  try {
    // TAINT: req.body.command flows to rust_backend command injection!
    const response = await axios.post(
      `${SERVICES.rustBackend}/api/exec`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.get('/api/calc', async (req, res) => {
  try {
    // TAINT: query params flow to rust_backend integer overflow vulnerability
    const response = await axios.get(
      `${SERVICES.rustBackend}/api/calc`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

app.get('/api/fetch', async (req, res) => {
  try {
    // TAINT: query.url flows to rust_backend SSRF vulnerability!
    const response = await axios.get(
      `${SERVICES.rustBackend}/api/fetch`,
      { params: req.query }
    );
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data || error.message,
    });
  }
});

// -----------------------------------------------------------------------------
// ROUTE GROUP 4: Cross-Service Operations
// These routes demonstrate multi-service taint flows
// -----------------------------------------------------------------------------

// Full user enrichment: Gateway → Python API → Pipeline → Rust
app.post('/api/users/:userId/full-enrich', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Step 1: Get user from Python API (SQL injection point)
    const userResponse = await axios.get(
      `${SERVICES.pythonApi}/status/${userId}`
    );

    // Step 2: Search for related data in Rust backend (SQL injection point)
    const searchResponse = await axios.get(
      `${SERVICES.rustBackend}/api/users/search`,
      { params: { q: userResponse.data.username || userId } }
    );

    // Step 3: Process through pipeline (eval vulnerability point)
    const pipelineResponse = await axios.post(
      `${SERVICES.pipeline}/users/${userId}/process`,
      { enrichment_data: searchResponse.data }
    );

    res.json({
      user: userResponse.data,
      search_results: searchResponse.data,
      pipeline_result: pipelineResponse.data,
      taint_flow: 'Gateway → Python API → Rust Backend → Pipeline',
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      step: error.config?.url || 'unknown',
    });
  }
});

// -----------------------------------------------------------------------------
// Health & Diagnostics
// -----------------------------------------------------------------------------

app.get('/health', async (req, res) => {
  const services = {};

  // Check each service
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      services[name] = 'healthy';
    } catch {
      services[name] = 'unhealthy';
    }
  }

  res.json({
    gateway: 'healthy',
    services,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/debug/routes', (req, res) => {
  // VULN: Exposing internal routing information
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    }
  });
  res.json({ routes, services: SERVICES });
});

// -----------------------------------------------------------------------------
// Error Handling
// -----------------------------------------------------------------------------

app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err);
  // VULN: Leaking stack traces
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    requestId: req.requestId,
  });
});

// -----------------------------------------------------------------------------
// Server Startup
// -----------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`
================================================================================
  PROJECT ANARCHY - UNIFIED GATEWAY
================================================================================

  Gateway running on port ${PORT}

  Connected Services:
  - Python API (api/):           ${SERVICES.pythonApi}
  - Python Pipeline:             ${SERVICES.pipeline}
  - Rust Backend:                ${SERVICES.rustBackend}

  Taint Flow Examples:
  1. GET  /api/users/search?username=admin' OR '1'='1
     → Gateway → api/db.py SQL injection

  2. GET  /api/files/read?path=../../../etc/passwd
     → Gateway → rust_backend/ path traversal

  3. POST /api/pipeline/import/csv {file_path: "..."}
     → Gateway → python_pipeline/ eval() injection

  4. POST /api/users/:id/full-enrich
     → Gateway → Python API → Rust → Pipeline (multi-service flow)

================================================================================
  `);
});

module.exports = app;
