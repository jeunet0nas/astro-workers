// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

/** Cloudflare dev bundles SSR với esbuild và không áp dụng plugin Vite của Keystatic → lỗi `virtual:keystatic-config`. Chỉ bật adapter khi không chạy `astro dev`. */
const isDevServer =
	process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';

// https://astro.build/config
export default defineConfig({
  adapter: isDevServer ? undefined : cloudflare(),
  integrations: [react(), markdoc(), keystatic()]
});