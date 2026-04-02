// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// Load environment variables from .env files (Astro config runs before Astro loads them)
const DEFAULT_KEYSTATIC_GITHUB_REPO = 'jeunet0nas/astro-workers';
const { KEYSTATIC_GITHUB_REPO = '' } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const keystaticGithubRepo = KEYSTATIC_GITHUB_REPO || DEFAULT_KEYSTATIC_GITHUB_REPO;

/** Cloudflare dev bundles SSR với esbuild và không áp dụng plugin Vite của Keystatic → lỗi `virtual:keystatic-config`. Chỉ bật adapter khi không chạy `astro dev`. */
const isDevServer =
	process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';

// https://astro.build/config
export default defineConfig({
  adapter: isDevServer ? undefined : cloudflare(),
  integrations: [react(), markdoc(), keystatic()],
  vite: {
    define: {
      // Inject repo at build time so keystatic.config.ts can access it client-side
      'import.meta.env.KEYSTATIC_GITHUB_REPO': JSON.stringify(keystaticGithubRepo),
    },
  },
});