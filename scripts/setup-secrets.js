#!/usr/bin/env node

/**
 * Interactive script to help set up Cloudflare Worker secrets
 */

import { spawn } from 'child_process';
import readline from 'readline';
import crypto from 'crypto';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
};

console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
console.log(`${colors.blue}Cloudflare Worker Secrets Setup${colors.reset}`);
console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

console.log(`${colors.cyan}This script will help you set secrets for your Cloudflare Worker.${colors.reset}`);
console.log(`${colors.cyan}You'll be prompted to enter each secret value.${colors.reset}\n`);

const secrets = [
	{
		name: 'KEYSTATIC_GITHUB_CLIENT_ID',
		description: 'GitHub App Client ID',
		hint: 'Found in GitHub App settings',
	},
	{
		name: 'KEYSTATIC_GITHUB_CLIENT_SECRET',
		description: 'GitHub App Client Secret',
		hint: 'Generate in GitHub App settings',
	},
	{
		name: 'KEYSTATIC_SECRET',
		description: 'Keystatic session secret (min 32 chars)',
		hint: 'Generate with: openssl rand -hex 32',
		generate: true,
	},
	{
		name: 'PUBLIC_KEYSTATIC_GITHUB_APP_SLUG',
		description: 'GitHub App slug',
		hint: 'Found in GitHub App URL',
	},
	{
		name: 'KEYSTATIC_GITHUB_REPO',
		description: 'GitHub repository (format: owner/repo)',
		hint: 'Example: jeunet0nas/astro-workers',
	},
];

function runCommand(command, args) {
	return new Promise((resolve, reject) => {
		const proc = spawn(command, args, {
			stdio: 'inherit',
			shell: true,
		});
		
		proc.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Command failed with code ${code}`));
			}
		});
	});
}

function question(query) {
	return new Promise((resolve) => {
		rl.question(query, resolve);
	});
}

async function setupSecrets() {
	console.log(`${colors.yellow}📝 Setting up ${secrets.length} secrets...${colors.reset}\n`);
	
	for (const secret of secrets) {
		console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
		console.log(`${colors.green}${secret.name}${colors.reset}`);
		console.log(`  ${secret.description}`);
		console.log(`  ${colors.yellow}Hint: ${secret.hint}${colors.reset}\n`);
		
		if (secret.generate) {
			const answer = await question('  Generate random secret automatically? (y/n): ');
			if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
				console.log(`\n  ${colors.cyan}Generating random secret...${colors.reset}`);
				const randomSecret = crypto.randomBytes(32).toString('hex');
				console.log(`  ${colors.yellow}Generated: ${randomSecret}${colors.reset}\n`);
				
				try {
					await runCommand('wrangler', ['secret', 'put', secret.name, '--stdin'], {
						input: randomSecret,
					});
					console.log(`  ${colors.green}✅ ${secret.name} set successfully${colors.reset}\n`);
				} catch (error) {
					console.error(`  ❌ Failed to set ${secret.name}: ${error.message}\n`);
				}
				continue;
			}
		}
		
		const proceed = await question(`  Set this secret now? (y/n): `);
		
		if (proceed.toLowerCase() === 'y' || proceed.toLowerCase() === 'yes') {
			console.log(`  ${colors.cyan}Running: wrangler secret put ${secret.name}${colors.reset}`);
			console.log(`  ${colors.yellow}(You'll be prompted to enter the value)${colors.reset}\n`);
			
			try {
				await runCommand('wrangler', ['secret', 'put', secret.name]);
				console.log(`  ${colors.green}✅ ${secret.name} set successfully${colors.reset}\n`);
			} catch (error) {
				console.error(`  ❌ Failed to set ${secret.name}: ${error.message}\n`);
			}
		} else {
			console.log(`  ${colors.yellow}⏭️  Skipped ${secret.name}${colors.reset}\n`);
		}
	}
	
	console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
	console.log(`${colors.green}✅ Secrets setup complete!${colors.reset}`);
	console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
	
	console.log(`${colors.cyan}Next steps:${colors.reset}`);
	console.log(`  1. Verify secrets: ${colors.yellow}wrangler secret list${colors.reset}`);
	console.log(`  2. Update wrangler.jsonc with KV namespace ID`);
	console.log(`  3. Deploy: ${colors.yellow}npm run deploy${colors.reset}\n`);
	
	console.log(`${colors.cyan}📖 See DEPLOYMENT.md for detailed instructions${colors.reset}\n`);
	
	rl.close();
}

setupSecrets().catch((error) => {
	console.error(`\n❌ Setup failed: ${error.message}\n`);
	rl.close();
	process.exit(1);
});
