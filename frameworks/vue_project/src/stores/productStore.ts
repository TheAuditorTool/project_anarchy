/**
 * Product Store - Pinia Store with Cross-file Taint Flow
 *
 * MODULE RESOLUTION TEST:
 * - Import: import { useProductStore } from '@/stores/productStore'
 * - Import: import { useProductStore } from '@stores/productStore'
 * - Should resolve to: src/stores/productStore.ts
 *
 * TAINT ANALYSIS TEST:
 * - Search query flows: Component → Store → API → Backend SQL
 * - File path flows: Component → Store → API → Backend filesystem
 * - This is a CRITICAL cross-file taint flow test case
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  Product,
  ProductSearchParams,
  ProductSearchResult,
  FileUploadRequest,
  FileUploadResponse,
} from '@/types';  // PATH MAPPING IMPORT
import {
  validateSearchQuery,
  validateFilePath,
  sanitizeInput,
  escapeForSql,
} from '@/utils';  // PATH MAPPING + INDEX RESOLUTION
import { productApi } from '@/api/products';  // PATH MAPPING IMPORT

export const useProductStore = defineStore('product', () => {
  // State
  const products = ref<Product[]>([]);
  const selectedProduct = ref<Product | null>(null);
  const searchResults = ref<ProductSearchResult | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const productCount = computed(() => products.value.length);
  const hasResults = computed(() => (searchResults.value?.total ?? 0) > 0);

  /**
   * Search products
   * TAINT FLOW: searchQuery → API → Backend SQL
   * VULNERABILITY: SQL Injection via search query
   */
  async function searchProducts(params: ProductSearchParams): Promise<void> {
    loading.value = true;
    error.value = null;

    // TAINT FLOW: User input "validated" but not sanitized
    const validation = validateSearchQuery(params.query);
    if (!validation.valid) {
      error.value = validation.errors[0]?.message ?? 'Invalid search query';
      loading.value = false;
      return;
    }

    // WEAK SANITIZATION: escapeForSql is intentionally incomplete
    const sanitizedQuery = escapeForSql(sanitizeInput(params.query));

    try {
      // TAINT SINK: Query sent to backend → SQL injection
      searchResults.value = await productApi.search({
        ...params,
        query: sanitizedQuery,  // Still vulnerable due to weak escaping
      });
      products.value = searchResults.value.results;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Search failed';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Upload product image
   * TAINT FLOW: filePath → API → Backend filesystem
   * VULNERABILITY: Path Traversal
   */
  async function uploadImage(request: FileUploadRequest): Promise<FileUploadResponse | null> {
    loading.value = true;
    error.value = null;

    // TAINT FLOW: File path "validated" but not properly sanitized
    const validation = validateFilePath(request.filePath);
    if (!validation.valid) {
      error.value = validation.errors[0]?.message ?? 'Invalid file path';
      loading.value = false;
      return null;
    }

    try {
      // TAINT SINK: Path sent to backend → path traversal
      const response = await productApi.uploadImage(request);
      return response;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Load all products
   */
  async function loadProducts(): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      products.value = await productApi.getAll();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load products';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Select a product
   */
  function selectProduct(product: Product | null): void {
    selectedProduct.value = product;
  }

  /**
   * Clear search results
   */
  function clearSearch(): void {
    searchResults.value = null;
  }

  return {
    // State
    products,
    selectedProduct,
    searchResults,
    loading,
    error,

    // Getters
    productCount,
    hasResults,

    // Actions
    searchProducts,
    uploadImage,
    loadProducts,
    selectProduct,
    clearSearch,
  };
});

export type ProductStore = ReturnType<typeof useProductStore>;
