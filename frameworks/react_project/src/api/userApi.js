/**
 * User API Client - React → Express Cross-Boundary Flow
 *
 * CROSS-BOUNDARY TAINT FLOWS:
 * 1. User search input → fetch → Express /api/users/search → SQL query (SQL Injection)
 * 2. User profile input → fetch → Express /api/users/:id → DB update
 * 3. Comment input → fetch → Express /api/comments → DOM render (XSS)
 *
 * Target backend: full_stack_node/backend (Express on port 3000)
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * TAINT FLOW #1: SQL Injection Path
 * Source: searchQuery (user input)
 * Sink: SQL query in backend
 * Path: React input → fetch → Express route → Sequelize → PostgreSQL
 */
export async function searchUsers(searchQuery) {
  // User input flows directly to URL parameter
  const response = await fetch(`${API_BASE}/users?search=${searchQuery}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}` // Token from storage
    }
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

/**
 * TAINT FLOW #2: Stored XSS Path
 * Source: userData.bio (user input)
 * Sink: database → later rendered in DOM
 * Path: React form → fetch POST → Express → DB → fetch GET → dangerouslySetInnerHTML
 */
export async function updateUserProfile(userId, userData) {
  // User input in request body flows to database
  const response = await fetch(`${API_BASE}/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      bio: userData.bio,           // TAINT: User controlled HTML/script
      displayName: userData.name,  // TAINT: User controlled
      website: userData.website    // TAINT: User controlled URL
    })
  });

  return response.json();
}

/**
 * TAINT FLOW #3: Command Injection Path
 * Source: reportParams.filename (user input)
 * Sink: shell command in backend
 * Path: React → fetch → Express /api/reports/generate → child_process.exec
 */
export async function generateReport(reportParams) {
  const response = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      filename: reportParams.filename,  // TAINT: flows to shell command
      format: reportParams.format,
      filters: reportParams.filters
    })
  });

  return response.json();
}

/**
 * TAINT FLOW #4: Path Traversal
 * Source: fileId (user input)
 * Sink: file system read
 * Path: React → fetch → Express /api/files/:fileId → fs.readFile
 */
export async function downloadFile(fileId) {
  // User controlled file identifier
  const response = await fetch(`${API_BASE}/files/${fileId}/download`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    throw new Error('File download failed');
  }

  return response.blob();
}

/**
 * TAINT FLOW #5: SSRF
 * Source: webhookUrl (user input)
 * Sink: server-side HTTP request
 * Path: React → fetch → Express /api/webhooks → axios.get(userUrl)
 */
export async function registerWebhook(webhookUrl, events) {
  const response = await fetch(`${API_BASE}/webhooks/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      url: webhookUrl,  // TAINT: flows to server-side HTTP request
      events: events
    })
  });

  return response.json();
}

/**
 * Login - returns token stored in localStorage
 */
export async function login(username, password) {
  const response = await fetch(`${API_BASE}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  const data = await response.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  return data;
}

/**
 * TAINT FLOW #6: NoSQL Injection
 * Source: filter object (user controlled)
 * Sink: MongoDB query
 */
export async function advancedSearch(filterObject) {
  const response = await fetch(`${API_BASE}/users/advanced-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      filter: filterObject  // TAINT: User controlled query object
    })
  });

  return response.json();
}

export default {
  searchUsers,
  updateUserProfile,
  generateReport,
  downloadFile,
  registerWebhook,
  login,
  advancedSearch
};
