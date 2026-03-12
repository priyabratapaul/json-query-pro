import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    build: {
      sourcemap: true, // Enable source maps
      outDir: 'dist'
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
    },
    plugins: [react(), tailwindcss()],
    worker: {
      format: 'es',
      plugins: () => [react()],
    },
});
