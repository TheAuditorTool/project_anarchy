<template>
  <div class="search-panel">
    <h2>Product Search</h2>
    <p class="description">
      Search for products. (TAINT SOURCE: SQL Injection via search query)
    </p>

    <form @submit.prevent="handleSearch">
      <div class="form-group">
        <label for="search">Search Query:</label>
        <!-- TAINT SOURCE: User input for SQL injection -->
        <input
          id="search"
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          @keyup.enter="handleSearch"
        />
        <small v-if="!searchValidation.valid" class="error">
          {{ searchValidation.errors[0]?.message }}
        </small>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </form>

    <!-- Results with XSS vulnerability via v-html -->
    <div v-if="hasResults" class="results">
      <h3>Results ({{ productCount }})</h3>
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="selectProduct(product)"
      >
        <h4>{{ product.name }}</h4>
        <p class="price">{{ formatPrice(product.price) }}</p>
        <!-- TAINT SINK: XSS - rendering user-controlled HTML -->
        <div class="description" v-html="product.description"></div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchPanel Component - Vue 3 Composition API with <script setup>
 *
 * MODULE RESOLUTION TESTS:
 * 1. PATH MAPPING: import from '@/stores' → src/stores/index.ts
 * 2. PATH MAPPING: import from '@/utils' → src/utils/index.ts
 * 3. PATH MAPPING: import from '@/composables' → src/composables/index.ts
 * 4. PATH MAPPING: import from '@/types' → src/types/index.ts
 *
 * TAINT ANALYSIS TEST:
 * - TAINT SOURCE: searchQuery (v-model user input)
 * - TAINT FLOW: searchQuery → useUserInput → productStore → productApi → Backend SQL
 * - TAINT SINK: v-html renders potentially malicious product descriptions
 *
 * Cross-file taint tracking REQUIRES proper module resolution.
 * Basename-only resolution breaks at:
 * - '@/stores' → 'stores' (cannot find productStore)
 * - '@/utils' → 'utils' (cannot find formatCurrency)
 */

import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';

// PATH MAPPING IMPORTS - These require proper module resolution
import { useProductStore } from '@/stores';  // INDEX RESOLUTION: @/stores → src/stores/index.ts
import { useUserInput } from '@/composables';  // INDEX RESOLUTION: @/composables → src/composables/index.ts
import { formatCurrency } from '@/utils';  // INDEX RESOLUTION: @/utils → src/utils/index.ts
import type { Product } from '@/types';  // INDEX RESOLUTION: @/types → src/types/index.ts

// Store and composable setup
const productStore = useProductStore();
const { searchQuery, searchValidation } = useUserInput();

// Destructure reactive state from store
const {
  products,
  searchResults,
  loading,
  error,
} = storeToRefs(productStore);

// Computed properties
const hasResults = computed(() => (searchResults.value?.total ?? 0) > 0);
const productCount = computed(() => products.value.length);

// Methods
function formatPrice(price: number): string {
  return formatCurrency(price);
}

function selectProduct(product: Product): void {
  productStore.selectProduct(product);
}

/**
 * Handle search form submission
 * TAINT FLOW: searchQuery → productStore.searchProducts → API → Backend SQL
 */
async function handleSearch(): Promise<void> {
  if (!searchValidation.value.valid) {
    return;
  }

  // TAINT PASSTHROUGH: User input flows to store
  await productStore.searchProducts({
    query: searchQuery.value,  // TAINT: SQL injection payload
  });
}

// Watch for search query changes (debounced search could be added here)
watch(searchQuery, (newQuery) => {
  if (!newQuery) {
    productStore.clearSearch();
  }
});
</script>

<style scoped>
.search-panel {
  padding: 20px;
  max-width: 800px;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group small.error {
  color: #f44336;
  font-size: 12px;
}

button {
  background: #2196F3;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.results {
  margin-top: 30px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.product-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.product-card h4 {
  margin: 0 0 10px 0;
}

.price {
  color: #4CAF50;
  font-weight: bold;
  font-size: 18px;
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: 4px;
  color: #c62828;
}
</style>
