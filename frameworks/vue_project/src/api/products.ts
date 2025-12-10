/**
 * Products API - Product Endpoints with Taint Flows
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { productApi } from './products'
 * - Import: import { productApi } from '@/api/products'
 * - Should resolve to: src/api/products.ts
 *
 * TAINT ANALYSIS TEST:
 * - Search query: Component → Store → This API → Backend SQL
 * - File path: Component → Store → This API → Backend filesystem
 * - XML content: Component → Store → This API → Backend XML parser
 *
 * CRITICAL: This is the final hop before backend - proper module
 * resolution is essential to track taint to this boundary.
 */

import { httpClient } from './client';  // RELATIVE IMPORT
import type {
  Product,
  ProductSearchParams,
  ProductSearchResult,
  FileUploadRequest,
  FileUploadResponse,
} from '@/types';  // PATH MAPPING

/**
 * Product API endpoints
 */
export const productApi = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    return httpClient.get<Product[]>('/items/');
  },

  /**
   * Get product by ID
   */
  async getById(id: number): Promise<Product> {
    return httpClient.get<Product>(`/items/${id}`);
  },

  /**
   * Search products
   * TAINT SINK: SQL Injection - query goes to backend SQL
   *
   * @param params - Search parameters with tainted query
   */
  async search(params: ProductSearchParams): Promise<ProductSearchResult> {
    // TAINT FLOW: params.query → URL parameter → Backend SQL query
    return httpClient.get<ProductSearchResult>('/items/search-vulnerable', {
      params: {
        query: params.query,  // TAINT: SQL injection
        sort_by: params.sortBy || 'name',
        limit: params.limit || 20,
      },
    });
  },

  /**
   * Create product
   * TAINT SINK: XSS - description stored and rendered
   */
  async create(product: Omit<Product, 'id'>): Promise<Product> {
    // TAINT FLOW: product.description → Backend → Database → XSS
    return httpClient.post<Product>('/items/', product);
  },

  /**
   * Update product
   */
  async update(id: number, product: Partial<Product>): Promise<Product> {
    return httpClient.put<Product>(`/items/${id}`, product);
  },

  /**
   * Delete product
   */
  async delete(id: number): Promise<void> {
    return httpClient.delete<void>(`/items/${id}`);
  },

  /**
   * Upload product image
   * TAINT SINK: Path Traversal - filePath goes to backend filesystem
   *
   * @param request - Upload request with tainted file path
   */
  async uploadImage(request: FileUploadRequest): Promise<FileUploadResponse> {
    // TAINT FLOW: request.filePath → Backend → open(filePath, 'w')
    return httpClient.post<FileUploadResponse>('/upload-vulnerable/', {
      file_path: request.filePath,  // TAINT: Path traversal
      content: request.content,
    });
  },

  /**
   * Import products from XML
   * TAINT SINK: XXE - XML content parsed with external entities
   *
   * @param xmlContent - User-controlled XML string
   */
  async importXml(xmlContent: string): Promise<{ success: boolean; imported: number }> {
    // TAINT FLOW: xmlContent → Backend XML parser → XXE
    return httpClient.post<{ success: boolean; imported: number }>(
      '/items/import-xml',
      xmlContent,
      {
        headers: { 'Content-Type': 'application/xml' },
      }
    );
  },

  /**
   * Render product email template
   * TAINT SINK: SSTI - template rendered by Jinja2
   *
   * @param productId - Product to render
   * @param template - User-controlled template string
   */
  async renderEmailPreview(
    productId: number,
    template: string
  ): Promise<{ rendered: string }> {
    // TAINT FLOW: template → Backend Jinja2 → SSTI
    return httpClient.post<{ rendered: string }>(
      `/items/${productId}/email-preview`,
      { template }  // TAINT: Server-side template injection
    );
  },
};
