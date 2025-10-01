import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin with security issues
    {
      name: 'custom-security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // ERROR 338: Insecure CSP - includes unsafe-inline and unsafe-eval
          // This nullifies most XSS protections
          res.setHeader(
            'Content-Security-Policy',
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +  // DANGEROUS
            "style-src 'self' 'unsafe-inline'; " +  // Also dangerous
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' *; " +  // Allows any connection
            "frame-src 'self' *"  // Allows any iframe
          );
          
          // Other security headers (some missing)
          res.setHeader('X-Content-Type-Options', 'nosniff');
          // Missing: X-Frame-Options
          // Missing: Strict-Transport-Security
          
          next();
        });
      }
    }
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  
  server: {
    port: 3001,
    host: '0.0.0.0',  // Listening on all interfaces
    cors: {
      origin: '*',  // Allow all origins in dev
      credentials: true
    }
  },
  
  build: {
    // ERROR 339: Source maps enabled in production
    // Leaks original source code in production environment
    sourcemap: true,  // Should be false or 'hidden' for production
    
    rollupOptions: {
      output: {
        // Predictable chunk names (security issue)
        chunkFileNames: '[name]-[hash].js',
        entryFileNames: '[name]-[hash].js',
        assetFileNames: '[name]-[hash].[ext]'
      }
    },
    
    // Very large chunk size warning threshold
    chunkSizeWarningLimit: 2000,  // 2MB warning threshold
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,  // Keeping console.logs in production
        drop_debugger: false  // Keeping debugger statements!
      }
    }
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand'],
    // Force re-optimization frequently (performance issue)
    force: true
  },
  
  // Environment variable prefix (exposes too much)
  envPrefix: ['VITE_', 'REACT_APP_', 'PUBLIC_'],  // Multiple prefixes
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: '0.0.0.0',
    cors: true
  },
  
  // Define global constants (leaking info)
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(process.env.GITHUB_SHA || 'local'),
    __NODE_ENV__: JSON.stringify(process.env.NODE_ENV)
  }
});