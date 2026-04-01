# Copilot Instructions for my-astro-app

## Build, Deploy, and Development Commands

```bash
# Development
npm run dev              # Start Astro dev server (adapter disabled, auto local mode)

# Build & Deploy
npm run build            # Build for production (Cloudflare adapter enabled)
npm run preview          # Build and preview locally
npm run deploy           # Build and deploy to Cloudflare Workers (with pre-deploy validation)
npm run deploy:check     # Validate configuration before deployment
npm run deploy:secrets   # Interactive secrets setup helper

# Type Generation
npm run generate-types   # Generate Cloudflare Worker types
npm run cf-typegen       # Same as above

# Package Management
npm install              # Installs deps + runs patch-package postinstall
```

**No test or lint commands exist** in this project.

## Architecture Overview

### Deployment Target
This is an **Astro 6** site deployed to **Cloudflare Workers** using the `@astrojs/cloudflare` adapter. It includes a headless CMS via **Keystatic** for content management.

### Conditional Adapter Pattern
The Cloudflare adapter is **conditionally disabled** during `npm run dev`:

```javascript
// astro.config.mjs
const isDevServer = process.argv.includes('dev') || process.env.npm_lifecycle_event === 'dev';
adapter: isDevServer ? undefined : cloudflare()
```

**Why?** Cloudflare's dev mode uses esbuild for SSR bundling, which doesn't apply Vite plugins. This breaks Keystatic's `virtual:keystatic-config` module resolution. Disabling the adapter during dev allows Keystatic to work locally. Production builds (`npm run build`/`npm run deploy`) always use the adapter.

### Content Architecture

Three Keystatic collections with distinct purposes:

| Collection | Path | Route | Purpose |
|------------|------|-------|---------|
| **posts** | `src/content/posts/*.mdoc` | `/blog/[slug]` | Blog posts with cover images, publish dates, draft status |
| **pages** | `src/content/pages/*.mdoc` | `/[slug]` | Static pages with header navigation control |
| **sitePages** | `src/content/site-pages/*.mdoc` | `/` and `/blog` | Homepage and blog index with hero sections, CTAs, and navigation |

**Collection schemas** are defined in two places:
1. **Keystatic schema** (`keystatic.config.ts`) - Defines CMS editor fields and behavior
2. **Astro schema** (`src/content.config.ts`) - Validates content at build time with Zod

Both must stay in sync. When adding fields, update both files.

### Image Handling

Images are stored in `src/assets/images/{posts,pages}/` and configured per-collection in `keystatic.config.ts`:

```typescript
const postImageOpts = {
  directory: 'src/assets/images/posts',
  publicPath: '../../assets/images/posts/',
};
```

Markdoc image nodes are rendered via the custom `MarkdocImage.astro` component (configured in `markdoc.config.mjs`).

### Storage Modes (Auto-detected)

Keystatic **automatically detects the environment** and selects the appropriate storage mode:

#### Production (Cloudflare Workers)
- **Detection:** `CF_PAGES === '1'` or `CLOUDFLARE_ENV === 'production'` or `NODE_ENV === 'production'`
- **Mode:** `github` (forced)
- **Behavior:** Keystatic commits to GitHub via OAuth
- **Requirements:** 
  - GitHub App created and installed
  - Secrets set via `wrangler secret put`
  - KV namespace for sessions (`SESSION` binding)
- **Validation:** Strict - throws errors if secrets missing

#### Development (Local)
- **Detection:** No production indicators present
- **Mode:** `local` (default)
- **Behavior:** Edits write directly to filesystem
- **Requirements:** None - works out of the box
- **Validation:** Relaxed - warnings only

**Manual override:** Set `KEYSTATIC_STORAGE_KIND` explicitly to force a mode (not recommended).

**Configuration:** `keystatic.config.ts` handles detection and validation with helpful error messages.

## Project-Specific Conventions

### Environment Variables & Security

**Auto-detection replaces manual configuration:**

- **Old way:** Set `KEYSTATIC_STORAGE_KIND=github` manually
- **New way:** Deploy to Workers → auto-detects production → uses GitHub mode

**Validation:** `src/utils/env-validation.ts` and `keystatic.config.ts` both validate:
- **Production:** Strict validation, errors if secrets missing
- **Development:** Relaxed validation, warnings only
- **Placeholder detection:** Catches `your_client_id_here` etc.
- **Secret strength:** Warns if `KEYSTATIC_SECRET` < 32 chars

**Pre-deploy validation:**
```bash
npm run deploy:check  # Validates before deploying
```

This runs `scripts/validate-deploy.js` which checks:
- All required secrets set
- No placeholder values
- KV namespace configured
- wrangler.jsonc valid

### Astro 6 + Keystatic Compatibility

Keystatic's peer dependencies declare support for `astro@2-5`, but this project uses Astro 6. To install without peer dependency conflicts:

```
# .npmrc
legacy-peer-deps=true
```

This setting is **intentional** and required until Keystatic officially supports Astro 6.

### Windows-Specific Patch

The project includes `patches/astro+6.1.2.patch` applied via `patch-package` during `npm install`. 

**Issue:** On Windows, concurrent writes to Astro's data store (`data-store.json`) can cause `ENOENT` errors when renaming `.tmp` files. This happens frequently when Keystatic saves posts with images.

**Fix:** The patch randomizes temp file names (`data-store.json.<random>.tmp`) to avoid collisions:

```diff
- const tempFile = `${filePath}.tmp`;
+ const unique = randomBytes(8).toString("hex");
+ const tempFile = `${filePath}.${unique}.tmp`;
```

If upgrading Astro, regenerate the patch if this issue persists.

### Content Collection Loaders

Astro content collections use the **glob loader** (Astro 6 feature) instead of the traditional filesystem approach:

```typescript
// src/content.config.ts
loader: glob({ pattern: '**/*.mdoc', base: './src/content/posts' })
```

This allows Keystatic's `.mdoc` files (Markdoc format) to be consumed by Astro's content layer.

### Navigation Menu System

Both `pages` and `sitePages` collections control header navigation via:
- `showInHeader` (boolean) - Whether to display in nav
- `navLabel` (string, optional) - Override display name
- `navOrder` (number) - Sort order (lower = earlier)

To implement the nav menu, query both collections and sort by `navOrder`.

## Cloudflare Worker Configuration

### Wrangler Config

The project has **two** wrangler configs:

1. **Root config** (`wrangler.jsonc`) - User-editable, includes KV bindings
2. **Generated config** (`dist/server/wrangler.json`) - Generated by Astro's Cloudflare adapter during build

The `npm run deploy` script uses the **generated config**:

```bash
astro build && wrangler deploy --config dist/server/wrangler.json
```

**Do not edit `dist/server/wrangler.json` manually** - it's regenerated on every build.

### KV Namespace for Sessions (REQUIRED)

Keystatic requires a KV namespace for OAuth session storage on production:

```jsonc
// wrangler.jsonc
"kv_namespaces": [
  {
    "binding": "SESSION",  // Must be "SESSION" for Keystatic
    "id": "your-kv-id"     // Create with: wrangler kv:namespace create SESSION
  }
]
```

**Without this KV binding, Keystatic OAuth will fail on production.**

### Setting Production Secrets

**Recommended:** Use the interactive helper:

```bash
npm run deploy:secrets
```

**Manual:** Use `wrangler secret put`:

```bash
wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
wrangler secret put KEYSTATIC_SECRET
wrangler secret put PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
wrangler secret put KEYSTATIC_GITHUB_REPO
```

**Verify secrets:**

```bash
wrangler secret list  # Shows all set secrets (values hidden)
```

**Alternative:** Set via Cloudflare Dashboard → Workers & Pages → Your Worker → Settings → Environment Variables.

## TypeScript Configuration

- **Base:** Extends `astro/tsconfigs/strict`
- **JSX:** Configured for React (`"jsx": "react-jsx", "jsxImportSource": "react"`)
- **Worker types:** Custom types in `worker-configuration.d.ts` (declarations for Cloudflare Worker bindings)

When adding new Cloudflare bindings (KV, D1, R2, etc.), update `worker-configuration.d.ts` to get type safety.

## Deployment Workflow

### Standard Deployment

1. **Pre-validate** (optional but recommended):
   ```bash
   npm run deploy:check
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```
   
   This automatically:
   - Runs `npm run predeploy` (validation)
   - Runs `astro build` (generates `dist/`)
   - Runs `wrangler deploy --config dist/server/wrangler.json`

3. **Verify:**
   ```bash
   wrangler tail  # Watch logs
   ```

### First-Time Production Setup

Complete setup required before first deploy:

1. **Create GitHub App** (see DEPLOYMENT.md)
2. **Set secrets:** `npm run deploy:secrets`
3. **Create KV namespace:** `wrangler kv:namespace create SESSION`
4. **Update wrangler.jsonc** with KV ID
5. **Deploy:** `npm run deploy`
6. **Test:** Access `https://your-worker.workers.dev/keystatic`

### Deployment Architecture

```
astro build
  ↓
dist/client/  → Static assets (images, CSS, JS)
dist/server/  → SSR entry point + wrangler.json
  ↓
wrangler deploy --config dist/server/wrangler.json
  ↓
Cloudflare Worker
  - Dynamic routes: /blog/[slug], /[slug]
  - Static assets: via ASSETS binding
  - Keystatic: /keystatic (GitHub OAuth)
  - Session storage: via SESSION KV binding
```

### Troubleshooting Deployment

**Blank page at /keystatic:**
- Check secrets: `wrangler secret list` (should show 5 secrets)
- Check KV binding in `wrangler.jsonc`
- Check Worker logs: `wrangler tail`
- See DEPLOYMENT.md troubleshooting section

**OAuth callback error:**
- GitHub App callback URL must match Worker domain exactly
- Format: `https://your-worker.workers.dev/api/keystatic/github/oauth/callback`

**Build errors:**
- Check Astro version: `npm list astro` (should be 6.1.2)
- Clean build: `rm -rf dist/ .astro/ && npm run build`

## Common Patterns

### Adding a New Content Collection

1. Add collection config to `keystatic.config.ts`
2. Add schema to `src/content.config.ts`
3. Export in `collections` object
4. Create directory: `src/content/<collection-name>/`
5. Add routes in `src/pages/` if needed

### Changing Content Fields

1. Update field in `keystatic.config.ts` (CMS editor)
2. Update schema in `src/content.config.ts` (build validation)
3. Update consuming components to handle new field
4. Existing content may need migration

### Working with Images

- Images in Keystatic are stored as relative paths
- Astro's `image()` helper provides optimized images with type safety
- Custom `MarkdocImage.astro` component handles Markdoc image rendering
- Image directories are configured per-collection in `keystatic.config.ts`

### Debugging Production Issues

```bash
# Watch Worker logs in real-time
wrangler tail

# Access specific deployment
wrangler tail --env production

# Filter for errors only
wrangler tail | grep -i error
```
