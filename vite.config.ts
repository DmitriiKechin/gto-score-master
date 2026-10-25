import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Относительные пути для корректной работы на GitHub Pages
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/jspdf')) {
            return 'pdf';
          }
          if (id.includes('node_modules/docx')) {
            return 'docx';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/zustand') || id.includes('node_modules/lucide-react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/zod')) {
            return 'zod';
          }
          return undefined;
        },
      },
    },
  },
});
