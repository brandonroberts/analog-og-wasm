/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import additionalModules from "@cf-wasm/plugins/nitro-additional-modules"

// https://vitejs.dev/config/


export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      ssr: true,
      static: false,
      nitro: {
        minify: true,
        preset: 'vercel-edge',
        modules: [additionalModules({ target: "edge-light" })],
        compatibilityDate: "2025-07-15"
      }
    }),
    tailwindcss()
  ]
}));
