<template>
  <div class="template-renderer">
    <h2>Email Template Renderer</h2>
    <p class="description">
      Create custom email templates. (TAINT SOURCE: Server-Side Template Injection)
    </p>

    <form @submit.prevent="handleRender">
      <div class="form-group">
        <label for="productId">Product ID:</label>
        <input
          id="productId"
          v-model="productId"
          type="number"
          placeholder="Enter product ID"
        />
      </div>

      <div class="form-group">
        <label for="template">Email Template:</label>
        <!-- TAINT SOURCE: Server-Side Template Injection -->
        <textarea
          id="template"
          v-model="templateContent"
          rows="12"
          :placeholder="templatePlaceholder"
        ></textarea>
        <small>
          Variables: {{ '{{ product.name }}' }}, {{ '{{ product.price }}' }}, {{ '{{ shop.url }}' }}
        </small>
        <small class="warning">
          Vulnerable to SSTI: {{ '{{ config.items() }}' }} or {{ '{{ self.__init__.__globals__ }}' }}
        </small>
      </div>

      <div class="example-buttons">
        <button
          v-for="example in examples"
          :key="example.name"
          type="button"
          class="example-btn"
          @click="loadExample(example)"
        >
          {{ example.name }}
        </button>
      </div>

      <button type="submit" :disabled="loading" class="submit-btn">
        {{ loading ? 'Rendering...' : 'Preview Email' }}
      </button>
    </form>

    <!-- Preview with double XSS risk -->
    <div v-if="preview" class="preview">
      <h3>Email Preview:</h3>
      <!-- TAINT SINK: Server-rendered content displayed as HTML -->
      <div class="email-preview" v-html="preview.rendered"></div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TemplateRenderer Component - Vue 3 Composition API with <script setup>
 *
 * MODULE RESOLUTION TESTS:
 * 1. PATH MAPPING: import from '@/api/products' → src/api/products.ts
 * 2. PATH MAPPING: import from '@composables/useUserInput' → src/composables/useUserInput.ts
 * 3. RELATIVE: import from '../stores' → src/stores/index.ts
 *
 * TAINT ANALYSIS TEST:
 * - TAINT SOURCE: templateContent (SSTI)
 * - TAINT FLOW: templateContent → productApi.renderEmailPreview → Backend Jinja2
 * - TAINT SINK: v-html renders server-rendered template output
 */

import { ref, computed } from 'vue';

// PATH MAPPING IMPORTS
import { productApi } from '@/api/products';  // PATH MAPPING
import { useUserInput } from '@composables/useUserInput';  // PATH MAPPING WITH PREFIX

// RELATIVE IMPORT
import { useProductStore } from '../stores';  // RELATIVE: ../stores → src/stores/index.ts

// Composable
const { setTemplateContent, getTemplateContent } = useUserInput();

// Store
const productStore = useProductStore();
const loading = computed(() => productStore.loading);
const error = computed(() => productStore.error);

// Local state
const productId = ref<number>(1);
const templateContent = ref<string>('');  // TAINT SOURCE: SSTI
const preview = ref<{ rendered: string } | null>(null);

// Template examples (including malicious ones for testing)
const examples = ref([
  {
    name: 'Basic',
    template: '<h1>{{ product.name }}</h1>\n<p>Price: ${{ product.price }}</p>',
  },
  {
    name: 'Full Email',
    template: `<html>
<body>
  <h1>New Product: {{ product.name }}</h1>
  <p>{{ product.description }}</p>
  <p><strong>Price:</strong> \${{ product.price }}</p>
  <p>Shop at {{ shop.url }}</p>
</body>
</html>`,
  },
  {
    name: 'SSTI Test',
    template: '{{ config.items() }}',  // SSTI payload
  },
  {
    name: 'RCE Test',
    template: '{{ self.__init__.__globals__ }}',  // SSTI payload for RCE
  },
]);

const templatePlaceholder = `Enter your email template...

Example:
<h1>{{ product.name }}</h1>
<p>Check out this great product for only \${{ product.price }}!</p>
<p>Order now at {{ shop.url }}</p>`;

/**
 * Load example template
 */
function loadExample(example: { name: string; template: string }): void {
  templateContent.value = example.template;
  setTemplateContent(example.template);
}

/**
 * Handle template rendering
 * TAINT FLOW: templateContent → productApi → Backend Jinja2 → SSTI
 */
async function handleRender(): Promise<void> {
  if (!productId.value || !templateContent.value.trim()) {
    return;
  }

  preview.value = null;

  try {
    // TAINT PASSTHROUGH: User-controlled template sent to backend
    preview.value = await productApi.renderEmailPreview(
      productId.value,
      templateContent.value  // TAINT: Server-side template injection
    );
  } catch (e) {
    console.error('Template rendering failed:', e);
  }
}
</script>

<style scoped>
.template-renderer {
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #666;
}

.form-group small.warning {
  color: #ff9800;
}

.example-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.example-btn {
  background: #607D8B;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.example-btn:hover {
  background: #455A64;
}

.submit-btn {
  background: #9C27B0;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.preview {
  margin-top: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.preview h3 {
  padding: 15px;
  margin: 0;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.email-preview {
  padding: 20px;
  background: white;
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
