import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron([{
      entry: 'electron/main.ts',
      vite: {
        build: {
          outDir: 'dist-electron',
          rollupOptions: {
            external: ['electron', 'knex', 'better-sqlite3', 'pg', 'mysql2', '@libsql/client'],
            output: { entryFileNames: 'main.js' },
          },
        },
      },
    }]),
  ],
  base: './',
  server: { port: 5173, strictPort: false, open: false },
});
