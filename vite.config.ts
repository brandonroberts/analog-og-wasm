/// <reference types="vitest" />

import { defineConfig } from 'vite';
import analog from '@analogjs/platform';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/

async function vercelWasmModule(): Promise<import("rollup").Plugin> {
  const { existsSync } = await import("node:fs");
  const { readFile } = await import("node:fs/promises");
  const { createHash } = await import("node:crypto");
  const { basename } = await import("node:path");
  const { default: MagicString } = await import("magic-string");

  const sha1 = (source: Buffer) => createHash("sha1").update(source).digest("hex").slice(0, 16);

  const cleanUrl = (url: string) => url.replace(/[?#].*$/, '')

  const assets = new Set<string>();

  return {
    name: "cf-wasm:vercel-wasm-modules",
    resolveId: {
      order: "pre",
      async handler(source, importer) {
        if (!source.endsWith(".wasm?module")) {
          return
        }
        const resolved = await this.resolve(source, importer, { skipSelf: true });
        if (!resolved?.id || resolved.id === source) {
          return;
        }
        const idPath = cleanUrl(resolved.id.startsWith("file://") ? resolved.id.slice(7) : resolved.id);
        if (!existsSync(idPath)) {
          return;
        }
        const buffer = await readFile(idPath);
        const assetName = `wasm/${basename(idPath, ".wasm")}-${sha1(buffer)}.wasm`;
        if (!assets.has(assetName)) {
          this.emitFile({
            type: "asset",
            fileName: assetName,
            source: buffer
          });
          assets.add(assetName);
        }
        return {
          id: `\0cf-wasm:vercel-wasm-module:external:${assetName}`,
          external: true,
          moduleSideEffects: false,
        }
      },
    },
    renderChunk: {
      order: "pre",
      handler(code, chunk) {
        if (
          !(
            chunk.moduleIds.some((id) => id.endsWith(".wasm")) ||
            chunk.imports.some((id) => id.endsWith(".wasm"))
          )
        ) {
          return;
        }
        const replaced = new MagicString(code);
        for (const match of code.matchAll(/(\0|\\0)cf-wasm:vercel-wasm-module:external:([^"']+)/gu)) {
          const assetName = match[2];
          const index = match.index;
          const len = match[0].length;
          if (index && assetName && assets.has(assetName)) {
            const nestedLevel =
              chunk.fileName.split("/").filter(Boolean).length - 1;
            const relativeId =
              (nestedLevel ? "../".repeat(nestedLevel) : "./") + assetName;

            replaced.overwrite(index, index + len, `${relativeId}?module`);
          }
        }
        if (replaced.hasChanged()) {
          return {
            code: replaced.toString(),
            map: replaced.generateMap({ includeContent: true }),
          };
        }
      },
    }
  }
}

export default defineConfig(() => ({
  build: {
    target: ['es2020'],
  },
  resolve: {
    mainFields: ['module'],
  },
  ssr: {
    noExternal: ['@cf-wasm/og'],
  },
  plugins: [
    analog({
      ssr: true,
      static: false,
      nitro: {
        preset: 'vercel-edge',
        rollupConfig: {
          plugins: [vercelWasmModule()]
        },
        externals: {
          inline: [
            /^@cf-wasm\/og(\/.*)?$/, // or just '@cf-wasm/og'
          ],
        },
        compatibilityDate: "2025-07-15",
      }      
    }),
    tailwindcss()
  ]
}));
