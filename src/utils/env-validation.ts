import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Detect if running in production Cloudflare Workers environment
 */
function isProductionEnvironment(): boolean {
	return (
		process.env.CF_PAGES === '1' ||
		process.env.CLOUDFLARE_ENV === 'production' ||
		process.env.NODE_ENV === 'production'
	);
}

/**
 * Validates required environment variables for Keystatic
 * Behavior changes based on detected environment:
 * - Production: Strict validation, errors on missing vars
 * - Development: Relaxed validation, warnings only
 */
export function validateEnvVars() {
	const errors: string[] = [];
	const warnings: string[] = [];
	
	const isProduction = isProductionEnvironment();
	const explicitStorageKind = process.env.KEYSTATIC_STORAGE_KIND;
	const storageKind = explicitStorageKind ?? (isProduction ? 'github' : 'local');
	
	// Log detected environment
	console.log(`\n🔍 Environment Detection:`);
	console.log(`  - Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
	console.log(`  - Storage: ${storageKind}${explicitStorageKind ? ' (explicit)' : ' (auto-detected)'}`);
	
	if (!explicitStorageKind && isProduction) {
		console.log(`  - Auto-selected GitHub mode for production`);
	}
	
	// GitHub mode validation
	if (storageKind === 'github') {
		const requiredGitHubVars = [
			'KEYSTATIC_GITHUB_CLIENT_ID',
			'KEYSTATIC_GITHUB_CLIENT_SECRET',
			'KEYSTATIC_SECRET',
			'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
			'KEYSTATIC_GITHUB_REPO',
		];

		const missingVars = requiredGitHubVars.filter(varName => !process.env[varName]);
		
		if (missingVars.length > 0) {
			const message = `Missing required env vars for GitHub mode:\n${missingVars.map(v => `    - ${v}`).join('\n')}`;
			
			if (isProduction) {
				// Production: strict - throw error
				errors.push(message);
				errors.push('Set via: wrangler secret put <VAR_NAME>');
			} else {
				// Dev: relaxed - just warn
				warnings.push(message);
				warnings.push('GitHub OAuth may not work without these. See SECURITY.md for setup.');
			}
		}

		// Validate secret strength
		const secret = process.env.KEYSTATIC_SECRET;
		if (secret && secret.length < 32) {
			warnings.push(
				'KEYSTATIC_SECRET is too short (< 32 chars). Generate a strong secret with: openssl rand -hex 32'
			);
		}

		// Check for example/placeholder values
		const placeholderValues = [
			'your_client_id_here',
			'your_client_secret_here',
			'your_random_secret_here',
			'your-app-slug',
			'your-username/your-repo',
		];

		for (const [key, value] of Object.entries(process.env)) {
			if (key.startsWith('KEYSTATIC_') && typeof value === 'string') {
				if (placeholderValues.includes(value)) {
					const message = `${key} still has placeholder value. Please set real credentials.`;
					if (isProduction) {
						errors.push(message);
					} else {
						warnings.push(message);
					}
				}
			}
		}
		
		// Production-specific: Check for KV session binding availability
		if (isProduction) {
			// Note: This check runs at build/start time, actual KV binding is runtime
			console.log('  - Ensure SESSION KV namespace is bound in wrangler.jsonc');
		}
	}
	
	// Local mode validation
	if (storageKind === 'local') {
		if (isProduction) {
			warnings.push(
				'Running in PRODUCTION with LOCAL storage mode. ' +
				'Content changes will not persist across deployments!'
			);
		} else {
			console.log('  - Local mode: Content saved to filesystem');
		}
	}

	// Security check: warn if .env might be committed (dev only)
	if (!isProduction) {
		const gitignorePath = join(process.cwd(), '.gitignore');
		if (existsSync(gitignorePath)) {
			const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
			if (!gitignoreContent.includes('.env')) {
				warnings.push(
					'⚠️  .env might not be in .gitignore! Make sure sensitive files are ignored.'
				);
			}
		}
	}

	// Log warnings
	if (warnings.length > 0) {
		console.warn('\n⚠️  Environment Configuration Warnings:');
		warnings.forEach((w) => console.warn(`  ${w}`));
	}

	// Throw on errors (production only)
	if (errors.length > 0) {
		console.error('\n❌ Environment Configuration Errors:');
		errors.forEach((e) => console.error(`  ${e}`));
		console.error(
			'\n📖 See SECURITY.md for setup instructions and DEPLOYMENT.md for production guide.\n'
		);
		throw new Error('Invalid environment configuration. Fix the errors above and restart.');
	}

	// Success message
	if (errors.length === 0 && warnings.length === 0) {
		const mode = storageKind === 'github' ? '☁️  GitHub' : '📁 Local';
		console.log(`✅ Environment validated successfully (${mode} mode)\n`);
	}
}

/**
 * Call this in development to remind devs about security
 */
export function securityReminder() {
	if (!isProductionEnvironment() && process.env.CI !== 'true') {
		console.log('🔐 Security Reminder:');
		console.log('  - Never commit .env or .dev.vars files');
		console.log('  - Rotate secrets if accidentally exposed');
		console.log('  - See SECURITY.md for best practices\n');
	}
}
