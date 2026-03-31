import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Validates required environment variables for Keystatic
 * Call this early in your app to fail fast if config is missing
 */
export function validateEnvVars() {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check storage kind
	const storageKind = process.env.KEYSTATIC_STORAGE_KIND;
	
	if (!storageKind) {
		warnings.push('KEYSTATIC_STORAGE_KIND not set, defaulting to "local"');
	}

	// If GitHub mode, validate required vars
	if (storageKind === 'github') {
		const requiredGitHubVars = [
			'KEYSTATIC_GITHUB_CLIENT_ID',
			'KEYSTATIC_GITHUB_CLIENT_SECRET',
			'KEYSTATIC_SECRET',
			'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
			'KEYSTATIC_GITHUB_REPO',
		];

		for (const varName of requiredGitHubVars) {
			if (!process.env[varName]) {
				errors.push(`Missing required env var for GitHub mode: ${varName}`);
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
					errors.push(`${key} still has placeholder value. Please set real credentials.`);
				}
			}
		}
	}

	// Security check: warn if .env might be committed
	if (process.env.NODE_ENV !== 'production') {
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
		warnings.forEach((w) => console.warn(`  - ${w}`));
	}

	// Throw on errors
	if (errors.length > 0) {
		console.error('\n❌ Environment Configuration Errors:');
		errors.forEach((e) => console.error(`  - ${e}`));
		console.error(
			'\n📖 See SECURITY.md for setup instructions and .env.example for template.\n'
		);
		throw new Error('Invalid environment configuration. Fix the errors above and restart.');
	}

	// Success message
	if (errors.length === 0 && warnings.length === 0) {
		const mode = storageKind === 'github' ? '☁️  GitHub' : '📁 Local';
		console.log(`✅ Environment validated successfully (${mode} mode)`);
	}
}

/**
 * Call this in development to remind devs about security
 */
export function securityReminder() {
	if (process.env.NODE_ENV !== 'production' && process.env.CI !== 'true') {
		console.log('\n🔐 Security Reminder:');
		console.log('  - Never commit .env or .dev.vars files');
		console.log('  - Rotate secrets if accidentally exposed');
		console.log('  - See SECURITY.md for best practices\n');
	}
}
