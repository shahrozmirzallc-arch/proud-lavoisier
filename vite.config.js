import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'

let commitSha = 'e7bf82c1cc0b6e49f3b5e38372331950281e6108';
try {
  commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VITE_COMMIT_SHA || execSync('git rev-parse HEAD').toString().trim();
} catch (e) {
  // fallback if git command not available
}

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.apk', '**/*.zip'],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commitSha)
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('exceljs')) {
              return 'vendor-exceljs';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) {
              return 'vendor-pdf-export';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react') || id.includes('@phosphor-icons/react')) {
              return 'vendor-icons';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor-utils';
          }
        }
      }
    }
  }
})
