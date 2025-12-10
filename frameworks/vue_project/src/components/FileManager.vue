<template>
  <div class="file-manager">
    <h2>File Manager</h2>
    <p class="description">
      Upload files and import XML data. (TAINT SOURCES: Path Traversal, XXE)
    </p>

    <!-- File Upload Section -->
    <section class="upload-section">
      <h3>Upload File</h3>
      <form @submit.prevent="handleUpload">
        <div class="form-group">
          <label for="filePath">File Path:</label>
          <!-- TAINT SOURCE: Path traversal attack vector -->
          <input
            id="filePath"
            v-model="filePath"
            type="text"
            placeholder="/uploads/images/product.jpg"
          />
          <small class="warning">
            Specify server path. (Vulnerable to path traversal: ../../../etc/passwd)
          </small>
        </div>

        <div class="form-group">
          <label for="fileContent">File Content:</label>
          <textarea
            id="fileContent"
            v-model="fileContent"
            rows="6"
            placeholder="File content (base64 or text)..."
          ></textarea>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Uploading...' : 'Upload File' }}
        </button>
      </form>
    </section>

    <!-- XML Import Section -->
    <section class="xml-section">
      <h3>Import XML</h3>
      <form @submit.prevent="handleXmlImport">
        <div class="form-group">
          <label for="xmlContent">XML Data:</label>
          <!-- TAINT SOURCE: XXE attack vector -->
          <textarea
            id="xmlContent"
            v-model="xmlContent"
            rows="10"
            :placeholder="xmlPlaceholder"
          ></textarea>
          <small class="warning">
            Vulnerable to XXE: &lt;!DOCTYPE foo [&lt;!ENTITY xxe SYSTEM "file:///etc/passwd"&gt;]&gt;
          </small>
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Importing...' : 'Import XML' }}
        </button>
      </form>
    </section>

    <!-- Results -->
    <div v-if="uploadResult" class="result">
      <h3>Upload Result:</h3>
      <pre>{{ JSON.stringify(uploadResult, null, 2) }}</pre>
    </div>

    <div v-if="xmlResult" class="result">
      <h3>Import Result:</h3>
      <pre>{{ JSON.stringify(xmlResult, null, 2) }}</pre>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * FileManager Component - Vue 3 Composition API with <script setup>
 *
 * MODULE RESOLUTION TESTS:
 * 1. SCOPED PACKAGE: import from '@vueuse/core' → node_modules/@vueuse/core
 * 2. PATH MAPPING: import from '@/stores/productStore' → src/stores/productStore.ts
 * 3. PATH MAPPING: import from '@api/products' → src/api/products.ts
 * 4. RELATIVE: import from './composables' (if exists)
 *
 * TAINT ANALYSIS TEST:
 * - TAINT SOURCE #1: filePath (path traversal)
 * - TAINT SOURCE #2: xmlContent (XXE)
 * - TAINT FLOW: filePath → productStore → productApi → Backend filesystem
 * - TAINT FLOW: xmlContent → productApi → Backend XML parser
 */

import { ref, computed } from 'vue';
import { useDebounceFn } from '@vueuse/core';  // SCOPED PACKAGE: @vueuse/core

// PATH MAPPING IMPORTS
import { useProductStore } from '@stores/productStore';  // PATH MAPPING: @stores/*
import { productApi } from '@api/products';  // PATH MAPPING: @api/*
import type { FileUploadResponse } from '@/types';

// Reactive state - TAINT SOURCES
const filePath = ref('');  // TAINT SOURCE: Path traversal
const fileContent = ref('');
const xmlContent = ref('');  // TAINT SOURCE: XXE

// Results
const uploadResult = ref<FileUploadResponse | null>(null);
const xmlResult = ref<{ success: boolean; imported: number } | null>(null);

// Store
const productStore = useProductStore();
const loading = computed(() => productStore.loading);
const error = computed(() => productStore.error);

// XML placeholder with vulnerable example
const xmlPlaceholder = `<?xml version="1.0"?>
<products>
  <product>
    <name>Test Product</name>
    <price>29.99</price>
  </product>
</products>`;

/**
 * Handle file upload
 * TAINT FLOW: filePath → productStore.uploadImage → API → Backend filesystem
 */
async function handleUpload(): Promise<void> {
  if (!filePath.value || !fileContent.value) {
    return;
  }

  uploadResult.value = null;

  // TAINT PASSTHROUGH: User-controlled path sent to backend
  const result = await productStore.uploadImage({
    filePath: filePath.value,  // TAINT: Path traversal
    content: fileContent.value,
  });

  uploadResult.value = result;
}

/**
 * Handle XML import
 * TAINT FLOW: xmlContent → productApi → Backend XML parser → XXE
 */
async function handleXmlImport(): Promise<void> {
  if (!xmlContent.value.trim()) {
    return;
  }

  xmlResult.value = null;

  try {
    // TAINT PASSTHROUGH: User-controlled XML sent to backend
    xmlResult.value = await productApi.importXml(xmlContent.value);  // TAINT: XXE
  } catch (e) {
    console.error('XML import failed:', e);
  }
}

// Debounced validation (demonstrates @vueuse/core usage)
const debouncedValidate = useDebounceFn(() => {
  console.log('Validating file path:', filePath.value);
}, 300);
</script>

<style scoped>
.file-manager {
  padding: 20px;
  max-width: 800px;
}

.description {
  color: #666;
  margin-bottom: 20px;
}

section {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #ddd;
}

section:last-of-type {
  border-bottom: none;
}

h3 {
  margin-bottom: 15px;
  color: #333;
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

button {
  background: #4CAF50;
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

.result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.result pre {
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
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
