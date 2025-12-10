<template>
  <div id="app">
    <header class="app-header">
      <h1>Vue Module Resolution Test</h1>
      <p>Testing @/ path mappings, relative imports, index resolution, scoped packages</p>
    </header>

    <nav class="app-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="app-main">
      <!-- New TypeScript Composition API Components -->
      <SearchPanel v-if="activeTab === 'search'" />
      <FileManager v-if="activeTab === 'files'" />
      <TemplateRenderer v-if="activeTab === 'template'" />

      <!-- Legacy Options API Components -->
      <ProductSearch v-if="activeTab === 'legacy-search'" />
      <ProductForm v-if="activeTab === 'legacy-create'" />
      <FileUploader v-if="activeTab === 'legacy-upload'" />
      <TemplateEditor v-if="activeTab === 'legacy-template'" />
    </main>

    <footer class="app-footer">
      <p>
        <strong>Module Resolution Test Cases:</strong>
        @/ path mapping | Relative imports | Index resolution | Scoped packages (@vueuse/core)
      </p>
      <p>
        <strong>Taint Flow Test Cases:</strong>
        SQL Injection | Path Traversal | XXE | SSTI | XSS
      </p>
      <p>
        Connected to: <code>{{ apiUrl }}</code>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * App Root Component - Vue 3 Composition API + TypeScript
 *
 * MODULE RESOLUTION TESTS IN THIS FILE:
 * 1. PATH MAPPING: import from '@/components/SearchPanel.vue' → src/components/SearchPanel.vue
 * 2. PATH MAPPING: import from '@components/FileManager.vue' → src/components/FileManager.vue
 * 3. RELATIVE: import from './components/TemplateRenderer.vue'
 * 4. RELATIVE: import from './components/ProductSearch.vue' (legacy Options API)
 *
 * This component demonstrates ALL import resolution patterns that
 * TheAuditor's module resolution must handle correctly.
 *
 * IMPORT RESOLUTION REQUIREMENTS:
 * - @/ → src/
 * - @components/ → src/components/
 * - @stores/ → src/stores/
 * - @utils/ → src/utils/
 * - @types/ → src/types/
 * - ./relative → resolve relative paths
 * - ../parent → resolve parent paths
 * - index.ts → resolve directory to index file
 */

import { ref } from 'vue';

// PATH MAPPING IMPORTS (new TypeScript components with <script setup>)
import SearchPanel from '@/components/SearchPanel.vue';  // PATH MAPPING: @/ → src/
import FileManager from '@components/FileManager.vue';  // PATH MAPPING: @components/ → src/components/

// RELATIVE IMPORTS
import TemplateRenderer from './components/TemplateRenderer.vue';  // RELATIVE

// Legacy components (Options API)
import ProductSearch from './components/ProductSearch.vue';  // RELATIVE
import ProductForm from './components/ProductForm.vue';  // RELATIVE
import FileUploader from './components/FileUploader.vue';  // RELATIVE
import TemplateEditor from './components/TemplateEditor.vue';  // RELATIVE

// Navigation state
const activeTab = ref<string>('search');

const tabs = [
  // New Composition API components
  { id: 'search', label: 'Search (TS + Composition)' },
  { id: 'files', label: 'Files (TS + Composition)' },
  { id: 'template', label: 'Template (TS + Composition)' },
  // Legacy Options API components
  { id: 'legacy-search', label: 'Search (JS + Options)' },
  { id: 'legacy-create', label: 'Create (JS + Options)' },
  { id: 'legacy-upload', label: 'Upload (JS + Options)' },
  { id: 'legacy-template', label: 'Template (JS + Options)' },
];

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.app-header h1 {
  margin-bottom: 10px;
}

.app-header p {
  opacity: 0.9;
  font-size: 14px;
}

.app-nav {
  background: white;
  padding: 15px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.app-nav button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.app-nav button:hover {
  background: #f5f5f5;
}

.app-nav button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.app-main {
  flex: 1;
  padding: 30px 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background: #333;
  color: white;
  padding: 20px;
  text-align: center;
  font-size: 14px;
}

.app-footer p {
  margin-bottom: 10px;
}

.app-footer p:last-child {
  margin-bottom: 0;
}

.app-footer code {
  background: rgba(255,255,255,0.1);
  padding: 2px 8px;
  border-radius: 3px;
}
</style>
