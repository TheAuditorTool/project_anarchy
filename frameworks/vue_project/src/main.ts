/**
 * Vue Application Entry Point - TypeScript Version
 *
 * MODULE RESOLUTION TESTS:
 * 1. PACKAGE: import from 'vue' → node_modules/vue
 * 2. PACKAGE: import from 'pinia' → node_modules/pinia
 * 3. RELATIVE: import from './App.vue' → src/App.vue
 * 4. PATH MAPPING: import from '@/stores' → src/stores/index.ts
 *
 * Cross-boundary taint flow demo connecting to FastAPI backend
 */

import { createApp } from 'vue';  // PACKAGE IMPORT
import { createPinia } from 'pinia';  // PACKAGE IMPORT

import App from './App.vue';  // RELATIVE IMPORT

// Create Vue application
const app = createApp(App);

// Install Pinia for state management
const pinia = createPinia();
app.use(pinia);

// Mount the application
app.mount('#app');

// Development logging
if (import.meta.env.DEV) {
  console.log('[Vue Anarchy] App mounted with Pinia store');
  console.log('[Vue Anarchy] Module resolution test project');
  console.log('[Vue Anarchy] Testing: @/ path mappings, relative imports, index resolution');
}
