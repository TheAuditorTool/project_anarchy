// Fake Errors: 5
// 1. lint.py: Use of eval() with potentially controlled input.
// 2. lint.py: An empty catch block that swallows errors silently.
// 3. aud lint --workset: `console.log` left in production-style code.
// 4. aud flow-analyze: A promise returned by fetch() has no .catch() error handler.
// 5. pattern_rca.py: Consistent misuse of == instead of ===.

// =============================================================================
// GATEWAY INTEGRATION
// This frontend now connects to the unified gateway which routes to:
// - api/ (Python FastAPI) - User operations, auth
// - python_pipeline/ - Data processing, batch operations
// - rust_backend/ - Search, file operations, calculations
//
// TAINT FLOWS:
// User Input → Frontend → Gateway → Backend Services → Vulnerabilities
// =============================================================================

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000';

function fetchUserData(userId, userConfig) {
  // FLAW 5: Misuse of == which can lead to type coercion bugs.
  if (userId == "0") {
    return null;
  }

  // FLAW 4: Missing error handling for the promise.
  // TAINT: userId flows to Gateway → Python API → db.py SQL injection
  fetch(`${GATEWAY_URL}/api/users/${userId}/status`)
    .then(res => res.json())
    .then(data => {
      // FLAW 3: console.log left in the code.
      console.log("User data fetched:", data);

      // FLAW 1: Use of eval is extremely dangerous.
      const configAction = eval(userConfig.action);
      configAction(data);
    });
}

async function deleteUser(userId) {
  try {
    await fetch(`${GATEWAY_URL}/api/users/${userId}`, { method: 'DELETE' });
  } catch (e) {
    // FLAW 2: Empty catch block hides errors.
  }
}

// =============================================================================
// NEW GATEWAY-CONNECTED FUNCTIONS
// These create real cross-boundary taint flows through the gateway
// =============================================================================

/**
 * Search users through the gateway
 * TAINT FLOW: searchTerm → Gateway → api/app.py → db.py SQL Injection
 *
 * @param {string} searchTerm - User-controlled search input
 * @returns {Promise} - Search results
 */
async function searchUsers(searchTerm) {
  // FLAW 5 REPEAT: Using == instead of ===
  if (searchTerm == null) {
    return [];
  }

  // TAINT: searchTerm flows to SQL injection vulnerability
  // Attack: searchUsers("admin' OR '1'='1' --")
  const response = await fetch(
    `${GATEWAY_URL}/api/users/search?username=${encodeURIComponent(searchTerm)}`
  );

  // FLAW 3 REPEAT: console.log in production
  console.log("Search query:", searchTerm);

  return response.json();
}

/**
 * Search via Rust backend (alternative search with different vulnerabilities)
 * TAINT FLOW: query → Gateway → rust_backend/main.rs SQL Injection
 */
async function searchUsersRust(query, sortBy, limit) {
  // TAINT: All params flow to Rust SQL injection
  const params = new URLSearchParams({
    q: query,
    sort: sortBy || 'username',
    limit: limit || 100
  });

  // FLAW 4 REPEAT: No .catch() handler
  return fetch(`${GATEWAY_URL}/api/search/users?${params}`)
    .then(res => res.json());
}

/**
 * Read file through Rust backend
 * TAINT FLOW: filePath → Gateway → rust_backend/main.rs Path Traversal
 *
 * @param {string} filePath - User-controlled file path
 */
async function readFile(filePath) {
  // TAINT: filePath flows to path traversal vulnerability
  // Attack: readFile("../../../etc/passwd")
  const response = await fetch(
    `${GATEWAY_URL}/api/files/read?path=${encodeURIComponent(filePath)}`
  );

  return response.json();
}

/**
 * Execute command through Rust backend
 * TAINT FLOW: command/args → Gateway → rust_backend/main.rs Command Injection
 *
 * @param {string} command - User-controlled command
 * @param {Array} args - User-controlled arguments
 */
async function executeCommand(command, args) {
  // TAINT: command and args flow to command injection vulnerability
  // Attack: executeCommand("sh", ["-c", "cat /etc/passwd"])
  const response = await fetch(`${GATEWAY_URL}/api/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, args })
  });

  return response.json();
}

/**
 * Process user through Python pipeline
 * TAINT FLOW: userId → Gateway → python_pipeline eval() vulnerability
 */
async function processUser(userId, enrichmentData) {
  const response = await fetch(
    `${GATEWAY_URL}/api/pipeline/users/${userId}/process`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichmentData)
    }
  );

  // FLAW 3 REPEAT: console.log
  console.log("Processing user:", userId);

  return response.json();
}

/**
 * Import CSV through pipeline
 * TAINT FLOW: filePath → Gateway → python_pipeline/data_ingestion.py eval()
 */
async function importCSV(filePath) {
  // TAINT: filePath flows to eval() vulnerability in data_ingestion.py
  const response = await fetch(`${GATEWAY_URL}/api/pipeline/import/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path: filePath })
  });

  return response.json();
}

/**
 * Perform calculation through Rust backend
 * TAINT FLOW: a/b/op → Gateway → rust_backend Integer Overflow
 */
async function calculate(a, b, operation) {
  // TAINT: Integer values flow to overflow vulnerability
  // Attack: calculate(2147483647, 1, "add")
  const params = new URLSearchParams({ a, b, op: operation });

  return fetch(`${GATEWAY_URL}/api/calc?${params}`)
    .then(res => res.json());
}

/**
 * Fetch URL through Rust backend (SSRF)
 * TAINT FLOW: url → Gateway → rust_backend SSRF vulnerability
 */
async function fetchExternalUrl(url) {
  // TAINT: URL flows to SSRF vulnerability
  // Attack: fetchExternalUrl("http://169.254.169.254/latest/meta-data/")
  return fetch(`${GATEWAY_URL}/api/fetch?url=${encodeURIComponent(url)}`)
    .then(res => res.json());
}

/**
 * Full user enrichment (multi-service taint flow)
 * TAINT FLOW: userId → Gateway → Python API → Rust Backend → Pipeline
 */
async function fullUserEnrichment(userId) {
  // TAINT: Triggers multi-service vulnerability chain
  const response = await fetch(
    `${GATEWAY_URL}/api/users/${userId}/full-enrich`,
    { method: 'POST' }
  );

  // FLAW 3 REPEAT: console.log
  console.log("Full enrichment for user:", userId);

  return response.json();
}

/**
 * Login through auth service
 * TAINT FLOW: credentials → Gateway → api/auth_service.py race condition
 */
async function login(username, password) {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    return response.json();
  } catch (e) {
    // FLAW 2 REPEAT: Empty catch block
  }
}

// Export for module usage (if using bundler)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchUserData,
    deleteUser,
    searchUsers,
    searchUsersRust,
    readFile,
    executeCommand,
    processUser,
    importCSV,
    calculate,
    fetchExternalUrl,
    fullUserEnrichment,
    login,
    GATEWAY_URL
  };
}