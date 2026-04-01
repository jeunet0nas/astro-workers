#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
const requiredTypeHints = {
	title: 'string',
	publishDate: 'date-like',
	draft: 'boolean',
	featured: 'boolean',
	category: 'string',
	tags: 'array',
	readingTime: 'number',
};

let errorCount = 0;
let warningCount = 0;

function readPostFiles() {
	if (!fs.existsSync(postsDir)) {
		throw new Error(`Posts directory not found: ${postsDir}`);
	}

	return fs.readdirSync(postsDir).filter((name) => name.endsWith('.mdoc'));
}

function extractFrontmatter(content) {
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	return match ? match[1] : '';
}

function hasField(frontmatter, field) {
	const pattern = new RegExp(`^${field}:`, 'm');
	return pattern.test(frontmatter);
}

function isBooleanLiteral(frontmatter, field) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
	if (!match) return false;
	return ['true', 'false'].includes(match[1].trim());
}

function isNumberLiteral(frontmatter, field) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
	if (!match) return false;
	return /^\d+$/.test(match[1].trim());
}

function isQuotedOrPlainString(frontmatter, field) {
	const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
	if (!match) return false;
	const value = match[1].trim();
	return value.length > 0;
}

function validateTagsArray(frontmatter, file) {
	const tagsBlock = frontmatter.match(/^tags:\s*\r?\n((?:\s+- .*\r?\n?)*)/m);
	if (!tagsBlock) {
		console.error(`❌ ${file}: missing "tags" field (expected ${requiredTypeHints.tags})`);
		errorCount++;
		return;
	}

	const items = tagsBlock[1]
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.startsWith('- '));

	if (items.length === 0) {
		console.error(`❌ ${file}: "tags" must be a non-empty YAML array`);
		errorCount++;
	}
}

function validatePost(file) {
	const fullPath = path.join(postsDir, file);
	const content = fs.readFileSync(fullPath, 'utf8');
	const frontmatter = extractFrontmatter(content);

	if (!frontmatter) {
		console.error(`❌ ${file}: missing frontmatter block`);
		errorCount++;
		return;
	}

	if (!hasField(frontmatter, 'title') || !isQuotedOrPlainString(frontmatter, 'title')) {
		console.error(`❌ ${file}: invalid "title" (expected ${requiredTypeHints.title})`);
		errorCount++;
	}

	if (!hasField(frontmatter, 'publishDate') || !isQuotedOrPlainString(frontmatter, 'publishDate')) {
		console.error(`❌ ${file}: invalid "publishDate" (expected ${requiredTypeHints.publishDate})`);
		errorCount++;
	}

	if (!hasField(frontmatter, 'draft') || !isBooleanLiteral(frontmatter, 'draft')) {
		console.error(`❌ ${file}: invalid "draft" (expected ${requiredTypeHints.draft})`);
		errorCount++;
	}

	if (!hasField(frontmatter, 'featured') || !isBooleanLiteral(frontmatter, 'featured')) {
		console.error(`❌ ${file}: invalid "featured" (expected ${requiredTypeHints.featured})`);
		errorCount++;
	}

	if (!hasField(frontmatter, 'category') || !isQuotedOrPlainString(frontmatter, 'category')) {
		console.error(`❌ ${file}: invalid "category" (expected ${requiredTypeHints.category})`);
		errorCount++;
	}

	validateTagsArray(frontmatter, file);

	if (!hasField(frontmatter, 'readingTime') || !isNumberLiteral(frontmatter, 'readingTime')) {
		console.error(`❌ ${file}: invalid "readingTime" (expected ${requiredTypeHints.readingTime})`);
		errorCount++;
	} else {
		const match = frontmatter.match(/^readingTime:\s*(\d+)$/m);
		const value = match ? Number(match[1]) : 0;
		if (value < 1) {
			console.error(`❌ ${file}: "readingTime" must be >= 1`);
			errorCount++;
		}
	}

	if (!hasField(frontmatter, 'summary')) {
		console.warn(`⚠️  ${file}: "summary" is missing (recommended for blog cards)`);
		warningCount++;
	}
}

function main() {
	console.log('Checking Astro/Keystatic post field consistency...\n');
	const files = readPostFiles();

	if (files.length === 0) {
		console.warn('No post files found in src/content/posts');
		process.exit(0);
	}

	files.forEach(validatePost);

	console.log('\n----------------------------------------');
	if (errorCount > 0) {
		console.error(`Found ${errorCount} error(s) and ${warningCount} warning(s).`);
		process.exit(1);
	}

	console.log(`All checks passed (${files.length} files).`);
	if (warningCount > 0) {
		console.warn(`Warnings: ${warningCount}`);
	}
}

main();
