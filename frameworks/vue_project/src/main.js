/**
 * Vue Application Entry Point
 * Cross-boundary taint flow demo connecting to FastAPI backend
 */

import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

// Mount the application
app.mount('#app');
