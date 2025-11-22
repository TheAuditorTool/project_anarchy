import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: '/',

  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      // Proxy to Rust backend
      '/api/rust': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rust/, '/api')
      },
      // Proxy to Python backend
      '/api/python': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/python/, '/api')
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: true,  // Intentional: source maps in production
    minify: false,    // Intentional: no minification
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
