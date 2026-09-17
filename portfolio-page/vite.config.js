import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 3000, strictPort: true },
    build: { outDir: 'build', emptyOutDir: true },
    // Temporary bridge while components still read the CRA variable name.
    // Removed in package 1.3 when src/services/api.js reads VITE_API_BASE.
    define: {
      'process.env.REACT_APP_BACKEND_CALL': JSON.stringify(env.VITE_API_BASE ?? ''),
    },
  };
});
