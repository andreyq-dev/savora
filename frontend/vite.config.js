import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    root: './',
    server: {
      port: 3000,
      open: true,
      proxy: isDev
        ? {
            // Proxy API calls to local backend (dev only)
            '/api': {
              target: 'http://localhost:5000',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, '')
            }
          }
        : undefined
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          login: resolve(__dirname, 'pages/auth/login.html'),
          register: resolve(__dirname, 'pages/auth/register.html')
        }
      }
    }
  };
});
