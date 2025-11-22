/**
 * Product API Client - Vue → FastAPI Cross-Boundary Flow
 *
 * CROSS-BOUNDARY TAINT FLOWS:
 * 1. Product search → FastAPI /items/search → SQL Injection
 * 2. File upload path → FastAPI /upload → Path Traversal
 * 3. Product description → FastAPI → DOM v-html (XSS)
 *
 * Target backend: frameworks/fastapi_project (FastAPI on port 8000)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * TAINT FLOW #1: SQL Injection via search
 * Source: query (user input)
 * Sink: SQL query in FastAPI backend
 */
export async function searchProducts(query) {
  // User input flows directly to query parameter
  const response = await fetch(`${API_BASE}/items/search?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}

/**
 * TAINT FLOW #2: Path Traversal via file upload
 * Source: filePath (user controlled)
 * Sink: file system write
 */
export async function uploadProductImage(filePath, content) {
  const response = await fetch(`${API_BASE}/upload/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_path: filePath,  // TAINT: Path traversal (e.g., "../../../etc/cron.d/evil")
      content: content
    })
  });

  return response.json();
}

/**
 * TAINT FLOW #3: Stored XSS via product description
 * Source: description (user controlled HTML)
 * Sink: v-html in Vue component
 */
export async function createProduct(productData) {
  const response = await fetch(`${API_BASE}/items/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: productData.name,
      price: productData.price,
      description: productData.description,  // TAINT: XSS payload stored in DB
      owner_id: productData.ownerId
    })
  });

  return response.json();
}

/**
 * Get all products (returns descriptions that may contain XSS)
 */
export async function getProducts() {
  const response = await fetch(`${API_BASE}/items/`);
  return response.json();
}

/**
 * TAINT FLOW #4: XXE via XML import
 * Source: xmlData (user controlled)
 * Sink: XML parser with external entities enabled
 */
export async function importProductsXml(xmlData) {
  const response = await fetch(`${API_BASE}/items/import-xml`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml'
    },
    body: xmlData  // TAINT: XXE payload
  });

  return response.json();
}

/**
 * TAINT FLOW #5: Template Injection
 * Source: template (user controlled)
 * Sink: Jinja2/server-side template
 */
export async function renderProductEmail(productId, template) {
  const response = await fetch(`${API_BASE}/items/${productId}/email-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template: template  // TAINT: SSTI payload like {{ config.items() }}
    })
  });

  return response.json();
}

/**
 * Get product by ID
 */
export async function getProduct(productId) {
  const response = await fetch(`${API_BASE}/items/${productId}`);
  return response.json();
}

/**
 * Delete product (no auth check in backend)
 */
export async function deleteProduct(productId) {
  const response = await fetch(`${API_BASE}/items/${productId}`, {
    method: 'DELETE'
  });
  return response.json();
}

export default {
  searchProducts,
  uploadProductImage,
  createProduct,
  getProducts,
  importProductsXml,
  renderProductEmail,
  getProduct,
  deleteProduct
};
