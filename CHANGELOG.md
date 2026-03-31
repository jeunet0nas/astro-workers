# Changelog

All notable changes to this project will be documented in this file.

## [2026-03-31] - Security Fixes & Environment Setup

### 🔐 Security Improvements (CRITICAL)

- **Fixed**: Removed hardcoded GitHub repo defaults from `keystatic.config.ts` to prevent accidental commits to wrong repository
- **Added**: `.env.example` and `.dev.vars.example` with placeholder values (never commit actual secrets!)
- **Added**: `SECURITY.md` with comprehensive security guidelines and setup instructions
- **Added**: Pre-commit hook example in `.husky/` to prevent committing sensitive files
- **Added**: Environment validation utility in `src/utils/env-validation.ts`
- **Improved**: Enhanced `.gitignore` with explicit comments and better patterns for environment files
- **Updated**: README.md with security warnings and proper setup instructions

### 🛠️ Configuration Fixes

- **Fixed**: Changed `compatibility_date` from `2026-03-31` to `2026-03-17` in `wrangler.jsonc` to match Wrangler 4.78.0 support
- **Improved**: Better error messages when required environment variables are missing in GitHub mode

### 📝 Documentation

- **Added**: Detailed security documentation in `SECURITY.md`
- **Added**: Setup instructions for GitHub App configuration
- **Added**: Credential rotation procedures
- **Updated**: README with security reminders and proper onboarding steps
- **Added**: Git hook documentation in `.husky/README.md`

### ⚠️ Breaking Changes

- **REQUIRED**: You must now explicitly set `KEYSTATIC_GITHUB_REPO` in `.env` when using `KEYSTATIC_STORAGE_KIND=github` (no more defaults)
- **ACTION REQUIRED**: If you have existing `.env` file with real credentials, ROTATE ALL SECRETS immediately:
  1. Generate new GitHub App client secret
  2. Generate new `KEYSTATIC_SECRET` with: `openssl rand -hex 32`
  3. Update all deployment environments

### 🔄 Migration Guide

If upgrading from previous version:

1. **Backup your current `.env`**: A backup was created as `.env.BACKUP-*`
2. **Create new `.env` from template**:
   ```bash
   cp .env.example .env
   ```
3. **Fill in your actual values** (generate new secrets!)
4. **Update Cloudflare Worker secrets**:
   ```bash
   wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
   wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
   wrangler secret put KEYSTATIC_SECRET
   ```

### 📋 Remaining Issues (To be addressed)

See detailed analysis in project documentation. Priority items:
- [ ] Code-split Keystatic bundle to reduce chunk size (>500KB warning)
- [ ] Add error handling for `getCollection()` calls
- [ ] Monitor for Keystatic Astro 6 official support (currently using `legacy-peer-deps`)
- [ ] Add test framework
- [ ] Consider self-hosting fonts

---

## Previous Changes

(No previous changelog entries - this is the first documented security audit)
