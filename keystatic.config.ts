import { config, collection, fields } from '@keystatic/core';

const postImageOpts = {
	directory: 'src/assets/images/posts',
	publicPath: '../../assets/images/posts/',
};

const pageImageOpts = {
	directory: 'src/assets/images/pages',
	publicPath: '../../assets/images/pages/',
};

/**
 * Get environment variables from the appropriate source.
 * In Cloudflare Workers runtime, use cloudflare:workers.
 * In Node.js/build time, use process.env.
 */
function getEnv(): Record<string, string | undefined> {
	// Try Cloudflare Workers env first
	try {
		// Dynamic import to avoid bundling issues
		const cfEnv = (globalThis as Record<string, unknown>).__CLOUDFLARE_WORKER__;
		if (cfEnv) {
			// We're in Cloudflare Workers - env vars are accessed differently
			// The config runs at build time, so we need to detect this
			return {};
		}
	} catch {
		// Not in Cloudflare Workers
	}

	// Fall back to process.env (Node.js / build time)
	return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
}

const env = getEnv();

/**
 * Detect if this config is being bundled for production.
 * During build, NODE_ENV is typically 'production'.
 * In Cloudflare Workers runtime, we check for specific indicators.
 */
function isProductionBuild(): boolean {
	// Check if running in production build
	if (env.NODE_ENV === 'production') return true;
	
	// Check Astro/Vite build mode
	if (typeof import.meta !== 'undefined') {
		const meta = import.meta as { env?: Record<string, string> };
		if (meta.env?.MODE === 'production') return true;
		if (meta.env?.PROD === 'true' || meta.env?.PROD === true) return true;
	}
	
	return false;
}

/**
 * Determine storage mode based on environment
 * - Explicit KEYSTATIC_STORAGE_KIND always takes precedence
 * - Production build → force 'github' mode
 * - Dev environment → default to 'local' mode
 * 
 * Note: Using import.meta.env for Vite/Astro to inline at build time
 */
const isProduction = isProductionBuild();

// Use import.meta.env for values that need to be inlined at build time
const metaEnv = (import.meta as { env?: Record<string, string | boolean> }).env ?? {};
const explicitStorageKind = env.KEYSTATIC_STORAGE_KIND || metaEnv.KEYSTATIC_STORAGE_KIND as string;

// For Cloudflare Workers: force 'github' mode when built for production
// The storage kind should be determined at BUILD time, not runtime
const storageKind: 'github' | 'local' = 
	explicitStorageKind === 'github' ? 'github' :
	explicitStorageKind === 'local' ? 'local' :
	(metaEnv.PROD || isProduction) ? 'github' : 'local';

// Get GitHub repo from env or import.meta.env
const githubRepo = env.KEYSTATIC_GITHUB_REPO || 
	(metaEnv.KEYSTATIC_GITHUB_REPO as string);
const githubBranchPrefix = env.KEYSTATIC_GITHUB_BRANCH_PREFIX;

// Log detected mode for debugging
if (typeof console !== 'undefined') {
	console.log(`[Keystatic] Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
	console.log(`[Keystatic] Storage mode: ${storageKind}${explicitStorageKind ? ' (explicit)' : ' (auto-detected)'}`);
}

// Validate GitHub mode configuration
if (storageKind === 'github') {
	if (!githubRepo) {
		const envHint = isProduction 
			? 'Set via Cloudflare Worker environment variables.'
			: 'Set in .env file (e.g., "owner/repo").';
		throw new Error(
			`KEYSTATIC_GITHUB_REPO is required when using GitHub storage mode.\n` +
			`${envHint}\n` +
			`See SECURITY.md for setup instructions.`
		);
	}
	
	// Validate repo format
	if (!githubRepo.includes('/') || githubRepo.split('/').length !== 2) {
		throw new Error(
			`KEYSTATIC_GITHUB_REPO must be in format "owner/repo".\n` +
			`Received: "${githubRepo}"`
		);
	}
	
	// In production, validate all required GitHub secrets are present
	if (isProduction) {
		const requiredSecrets = [
			'KEYSTATIC_GITHUB_CLIENT_ID',
			'KEYSTATIC_GITHUB_CLIENT_SECRET',
			'KEYSTATIC_SECRET',
			'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
		];
		
		const missingSecrets = requiredSecrets.filter(key => !env[key]);
		
		if (missingSecrets.length > 0) {
			throw new Error(
				`Production GitHub mode requires the following environment variables:\n` +
				missingSecrets.map(key => `  - ${key}`).join('\n') + '\n\n' +
				`Set them via: wrangler secret put <VAR_NAME>\n` +
				`See SECURITY.md and DEPLOYMENT.md for detailed instructions.`
			);
		}
		
		// Validate secret strength
		const secret = env.KEYSTATIC_SECRET;
		if (secret && secret.length < 32) {
			console.warn(
				`[Keystatic] WARNING: KEYSTATIC_SECRET is too short (${secret.length} chars < 32).\n` +
				`Generate a strong secret with: openssl rand -hex 32`
			);
		}
	} else {
		// In dev, just warn about missing secrets
		const requiredSecrets = [
			'KEYSTATIC_GITHUB_CLIENT_ID',
			'KEYSTATIC_GITHUB_CLIENT_SECRET',
			'KEYSTATIC_SECRET',
			'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
		];
		
		const missingSecrets = requiredSecrets.filter(key => !env[key]);
		
		if (missingSecrets.length > 0) {
			console.warn(
				`[Keystatic] GitHub mode enabled but missing some env vars:\n` +
				missingSecrets.map(key => `  - ${key}`).join('\n') + '\n' +
				`This may cause OAuth to fail. See SECURITY.md for setup.`
			);
		}
	}
}

const [repoOwner = '', repoName = ''] = (githubRepo ?? '').split('/');

const storage =
	storageKind === 'github'
		? {
				kind: 'github' as const,
				repo: { owner: repoOwner, name: repoName },
				...(githubBranchPrefix ? { branchPrefix: githubBranchPrefix } : {}),
			}
		: { kind: 'local' as const };

export default config({
	storage,
	collections: {
		posts: collection({
			label: 'Blog posts',
			slugField: 'title',
			path: 'src/content/posts/*',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				publishDate: fields.date({
					label: 'Publish date',
					defaultValue: { kind: 'today' },
				}),
				summary: fields.text({
					label: 'Summary',
					multiline: true,
				}),
				draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
				coverImage: fields.image({
					label: 'Cover image',
					...postImageOpts,
				}),
				content: fields.markdoc({
					label: 'Content',
					options: { image: postImageOpts },
				}),
			},
		}),
		pages: collection({
			label: 'Pages',
			slugField: 'title',
			path: 'src/content/pages/*',
			format: { contentField: 'content' },
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				showInHeader: fields.checkbox({
					label: 'Show in header menu',
					defaultValue: true,
				}),
				navLabel: fields.text({
					label: 'Header label',
					description: 'If empty, title will be used.',
				}),
				navOrder: fields.integer({
					label: 'Header order',
					defaultValue: 100,
				}),
				content: fields.markdoc({
					label: 'Content',
					options: { image: pageImageOpts },
				}),
			},
		}),
		sitePages: collection({
			label: 'Site pages',
			slugField: 'key',
			path: 'src/content/site-pages/*',
			format: { contentField: 'content' },
			schema: {
				key: fields.slug({ name: { label: 'Key (home/blog)' } }),
				pageTitle: fields.text({ label: 'Page title' }),
				pageDescription: fields.text({
					label: 'Page description',
					multiline: true,
				}),
				showInHeader: fields.checkbox({
					label: 'Show in header menu',
					defaultValue: true,
				}),
				navLabel: fields.text({
					label: 'Header label',
					description: 'If empty, page title will be used.',
				}),
				navOrder: fields.integer({
					label: 'Header order',
					defaultValue: 10,
				}),
				heroTitle: fields.text({
					label: 'Hero title',
					multiline: true,
				}),
				heroLead: fields.text({
					label: 'Hero lead',
					multiline: true,
				}),
				primaryCtaLabel: fields.text({ label: 'Primary CTA label' }),
				primaryCtaHref: fields.text({ label: 'Primary CTA href' }),
				secondaryCtaLabel: fields.text({ label: 'Secondary CTA label' }),
				secondaryCtaHref: fields.text({ label: 'Secondary CTA href' }),
				content: fields.markdoc({
					label: 'Body content',
					options: { image: pageImageOpts },
				}),
			},
		}),
	},
});
