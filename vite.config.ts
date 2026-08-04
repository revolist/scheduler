import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import angular from '@analogjs/vite-plugin-angular';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { resolveCommercialCssAliases } from './vite.commercial-aliases';

export default defineConfig(({ mode }) => ({
  base: './',
  resolve: {
    alias: {
      ...resolveCommercialCssAliases(),
      ...(mode === 'test'
        ? {
            '@revolist/revogrid-column-date': fileURLToPath(
              new URL('./tests/revogrid-column-date.stub.ts', import.meta.url),
            ),
          }
        : {}),
    },
    ...(mode === 'angular' ? { mainFields: ['module'] } : {}),
  },
  plugins: [
    ...(mode === 'angular' ? [angular()] : []),
    react(),
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('revo-') || tag.startsWith('revogr-') } } }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'recipes/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    server: { deps: { inline: true } },
  },
}));
