#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks all requirements before deploying to Cloudflare Workers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

const log = {
	error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
	success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
	warning: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
	info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
	section: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.blue}${'='.repeat(50)}${colors.reset}`),
};

let errorCount = 0;
let warningCount = 0;

/**
 * Get list of secrets set on Cloudflare Workers via wrangler
 */
function getCloudflareSecrets() {
	try {
		const output = execSync('wrangler secret list --format json', {
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		const secrets = JSON.parse(output);
		return secrets.map((s) => s.name);
	} catch {
		// Fallback: try without --format flag
		try {
			const output = execSync('wrangler secret list', {
				encoding: 'utf-8',
				stdio: ['pipe', 'pipe', 'pipe'],
			});
			// Parse JSON output (wrangler outputs JSON array by default)
			const secrets = JSON.parse(output);
			return secrets.map((s) => s.name);
		} catch {
			return null;
		}
	}
}

/**
 * Check if a required secret is set on Cloudflare Workers
 */
function checkCloudflareSecret(name, cloudflareSecrets) {
	if (cloudflareSecrets === null) {
		log.warning(`Could not verify ${name} (wrangler secret list failed)`);
		warningCount++;
		return false;
	}

	if (cloudflareSecrets.includes(name)) {
		log.success(`${name} is set on Cloudflare`);
		return true;
	} else {
		log.error(`Missing Cloudflare secret: ${name}`);
		log.info(`Set with: wrangler secret put ${name}`);
		errorCount++;
		return false;
	}
}

/**
 * Check wrangler.jsonc configuration
 */
function checkWranglerConfig() {
	const wranglerPath = path.join(process.cwd(), 'wrangler.jsonc');
	
	if (!fs.existsSync(wranglerPath)) {
		log.error('wrangler.jsonc not found');
		errorCount++;
		return false;
	}
	
	const content = fs.readFileSync(wranglerPath, 'utf-8');
	
	// Check for KV namespace binding
	if (!content.includes('"SESSION"')) {
		log.error('SESSION KV namespace binding not found in wrangler.jsonc');
		log.info('Add: { "binding": "SESSION", "id": "your-kv-id" }');
		errorCount++;
		return false;
	}
	
	if (content.includes('YOUR_KV_NAMESPACE_ID')) {
		log.error('wrangler.jsonc still has placeholder KV namespace ID');
		log.info('Create KV namespace: wrangler kv:namespace create SESSION');
		errorCount++;
		return false;
	}
	
	log.success('wrangler.jsonc configuration looks good');
	return true;
}

/**
 * Check if build directory exists and is ready
 */
function checkBuildOutput() {
	const distPath = path.join(process.cwd(), 'dist');
	
	if (!fs.existsSync(distPath)) {
		log.warning('dist/ directory not found - will build before deploy');
		warningCount++;
		return false;
	}
	
	const serverPath = path.join(distPath, 'server');
	if (!fs.existsSync(serverPath)) {
		log.warning('dist/server/ not found - will build before deploy');
		warningCount++;
		return false;
	}
	
	log.success('Build output exists');
	return true;
}

/**
 * Main validation
 */
async function validate() {
	log.section('🔍 Pre-Deployment Validation');
	
	console.log('\n📋 Checking Cloudflare Secrets...\n');
	
	// Get secrets from Cloudflare Workers
	const cloudflareSecrets = getCloudflareSecrets();
	
	if (cloudflareSecrets === null) {
		log.warning('Could not fetch Cloudflare secrets (are you logged in?)');
		log.info('Run: wrangler login');
		warningCount++;
	} else {
		log.info(`Found ${cloudflareSecrets.length} secret(s) on Cloudflare\n`);
	}
	
	// Required GitHub secrets (check on Cloudflare, not local env)
	const requiredSecrets = [
		'KEYSTATIC_GITHUB_CLIENT_ID',
		'KEYSTATIC_GITHUB_CLIENT_SECRET',
		'KEYSTATIC_SECRET',
		'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
		'KEYSTATIC_GITHUB_REPO',
	];
	
	requiredSecrets.forEach((secret) => checkCloudflareSecret(secret, cloudflareSecrets));
	
	console.log('\n📋 Checking Configuration Files...\n');
	
	// Check wrangler config
	checkWranglerConfig();
	
	// Check build output
	checkBuildOutput();
	
	// Summary
	log.section('📊 Validation Summary');
	
	if (errorCount === 0 && warningCount === 0) {
		log.success('All checks passed! Ready to deploy.');
		console.log('\nDeploy with: npm run deploy\n');
		process.exit(0);
	} else if (errorCount > 0) {
		log.error(`Found ${errorCount} error(s) and ${warningCount} warning(s)`);
		console.log('\n🔧 Fix the errors above before deploying.');
		console.log('📖 See DEPLOYMENT.md for detailed setup instructions.\n');
		process.exit(1);
	} else {
		log.warning(`Found ${warningCount} warning(s) but no errors`);
		console.log('\n⚠️  You can proceed, but review the warnings above.');
		console.log('📖 See DEPLOYMENT.md for best practices.\n');
		process.exit(0);
	}
}

// Run validation
validate().catch((error) => {
	log.error(`Validation failed: ${error.message}`);
	process.exit(1);
});
