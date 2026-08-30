import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/// <reference types="vitest" />
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      base: isProduction ? '/app/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
            secure: false
          }
        }
      },
      build: {
        outDir: '../backend/public/app',
        emptyOutDir: true,
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              // Note: react/react-dom stay in the index chunk (shared by all views) —
              // explicit chunking here produces an empty chunk warning.
              charts: ['recharts'],
              icons: ['lucide-react'],
              // Heavy ML libs — loaded only when ID photo editor opens
              mediapipe: ['@mediapipe/selfie_segmentation', '@mediapipe/tasks-vision'],
              imaging: ['@imgly/background-removal', 'onnxruntime-web'],
            },
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: ['./setupTests.ts'],
        globals: true
      }
    };
});
