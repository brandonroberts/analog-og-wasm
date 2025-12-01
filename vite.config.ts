/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';
import additionalModules from "@cf-wasm/plugins/nitro-additional-modules"

// https://vitejs.dev/config/


export default defineConfig(() => ({
  build: {
    target: ['es2020'],
    rollupOptions: {
      external: ['@analogjs/content', 'xhr2']
    }
  },
  resolve: {
    mainFields: ['module'],
  },
  plugins: [
    analog({
      ssr: true,
      static: false,
      nitro: {
        preset: 'vercel-edge',
        modules: [additionalModules({ target: "edge-light" })],
        compatibilityDate: "2025-07-15",
        rollupConfig: {
          external: ['@analogjs/content', 'xhr2'],
          plugins: [
            {
              name: 'exclude',
              transform(code) {
                if (code.includes(`import("xhr2")`)) {
                    code = code.replace(`import("xhr2")`, 'Promise.resolve({})');
                }

                if (code.includes(`import("@analogjs/content")`)) {
                    code = code.replace(`import("@analogjs/content")`, 'Promise.resolve({})');
                }

                return {
                  code
                };
              },
            }
          ]
        }
      }
    }),
    tailwindcss()
  ]
}));
