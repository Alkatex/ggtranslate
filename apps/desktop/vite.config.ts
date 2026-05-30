import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '')

  return {
    plugins: [
      react(),
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            define: {
              'process.env.DEEPGRAM_API_KEY': JSON.stringify(env.DEEPGRAM_API_KEY),
              'process.env.DEEPL_API_KEY': JSON.stringify(env.DEEPL_API_KEY),
            },
            build: {
              outDir: 'dist-electron',
              sourcemap: true,
            },
          },
        },
        {
          entry: 'electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              sourcemap: true,
            },
          },
        },
      ]),
    ],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'development'
          ? 'http://localhost:5173/railway'
          : env.VITE_API_URL
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      // ← Fix worklet dans le build packagé
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          'audio-processor.worklet': path.resolve(__dirname, 'src/worklets/audio-processor.worklet.js'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'audio-processor.worklet') {
              return 'worklets/audio-processor.worklet.js'
            }
            return '[name]-[hash].js'
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/railway': {
          target: 'https://ggtranslatebackend-production.up.railway.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/railway/, ''),
        },
      },
    },
  }
})