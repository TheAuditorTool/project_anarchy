import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite Configuration - Module Resolution Testing
 *
 * Path aliases MUST match tsconfig.json paths for:
 * - IDE intellisense
 * - Build-time resolution
 * - TheAuditor module resolution testing
 */
export default defineConfig({
  plugins: [vue()],

  resolve: {
    alias: {
      // PATH MAPPINGS - Must match tsconfig.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
    }
  },

  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to FastAPI backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  build: {
    // Intentional misconfig: source maps in production (ERROR #339)
    sourcemap: true,
    outDir: 'dist'
  }
});
