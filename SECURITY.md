# Security Notes

## 🔐 Environment Variables & Secrets

### Critical Security Requirements

**⚠️ NEVER commit sensitive credentials to git!**

### Files Containing Secrets (MUST be gitignored)

- `.env` - Local development secrets
- `.dev.vars` - Wrangler development secrets  
- `.wrangler/` - Wrangler cache and state
- `dist/` - Build output may contain secrets

All these are already in `.gitignore`, but always verify before committing.

### Setup Instructions

1. **Copy example files:**
   ```bash
   cp .env.example .env
   cp .dev.vars.example .dev.vars
   ```

2. **Fill in your actual values in `.env` and `.dev.vars`**

3. **Generate a secure KEYSTATIC_SECRET:**
   ```bash
   openssl rand -hex 32
   ```

### Required GitHub App Setup (for production Keystatic)

To use Keystatic in production with GitHub mode:

1. Create a GitHub App at: https://github.com/settings/apps/new
   - Homepage URL: Your site URL
   - Callback URL: `https://your-site.com/api/keystatic/github/oauth/callback`
   - Permissions needed:
     - Repository contents: Read & Write
     - Repository metadata: Read-only

2. After creating the app, note down:
   - Client ID → `KEYSTATIC_GITHUB_CLIENT_ID`
   - Generate a Client Secret → `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - App slug → `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

3. Install the GitHub App on your repository

4. Set environment variables in Cloudflare Worker:
   ```bash
   wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
   wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
   wrangler secret put KEYSTATIC_SECRET
   ```

### If Credentials Are Exposed

If you accidentally exposed credentials:

1. **Immediately rotate all secrets:**
   - Regenerate GitHub App client secret
   - Generate new `KEYSTATIC_SECRET`
   - Update all deployment environments

2. **If committed to git:**
   ```bash
   # Remove from git history (⚠️ requires force push)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Or use BFG Repo-Cleaner (recommended)
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Force push to remote** (⚠️ coordinate with team):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

4. **Notify your team** to re-clone the repository

### Production Deployment Checklist

- [ ] All secrets set in Cloudflare Worker environment
- [ ] `.env` and `.dev.vars` are gitignored
- [ ] No secrets in code or config files
- [ ] GitHub App properly configured
- [ ] Tested in preview environment first

### Local Development Mode

For local development, use `KEYSTATIC_STORAGE_KIND=local` in `.env`:
- No GitHub App needed
- Edits saved directly to local files
- Simpler setup for content editing

Only use `KEYSTATIC_STORAGE_KIND=github` for production deployments.
