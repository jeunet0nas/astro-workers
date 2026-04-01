# Security Notes

## 🔐 Environment Variables & Secrets

### Critical Security Requirements

**⚠️ NEVER commit sensitive credentials to git!**

---

## 📁 Files Containing Secrets (MUST be gitignored)

- `.env` - Local development secrets
- `.dev.vars` - Wrangler development secrets  
- `.wrangler/` - Wrangler cache and state
- `dist/` - Build output may contain secrets

All these are already in `.gitignore`, but always verify before committing.

---

## 🏠 Local Development Setup

### Quick Setup (Minimal)

For local development, you don't need GitHub App setup:

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (auto uses local mode)
npm run dev
```

Keystatic will automatically use **local storage mode** - no secrets required!

### Optional: Local .env File

If you want to customize settings:

```bash
# Copy example
cp .env.example .env

# Edit .env (optional - for advanced config)
```

**You don't need to set GitHub secrets for local dev!**

---

## ☁️ Production Deployment Security

### Required Secrets for Production

When deploying to Cloudflare Workers, you MUST set these secrets:

| Secret | Description | How to get |
|--------|-------------|------------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub App Client ID | GitHub App settings |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub App Client Secret | Generate in GitHub App |
| `KEYSTATIC_SECRET` | Session secret (32+ chars) | `openssl rand -hex 32` |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | GitHub App slug | From App URL |
| `KEYSTATIC_GITHUB_REPO` | Repository (owner/repo) | Your repo name |

### Setting Secrets in Cloudflare Worker

**Method 1: Interactive Helper (Recommended)**

```bash
npm run deploy:secrets
```

This interactive script guides you through setting all required secrets.

**Method 2: Manual via Wrangler CLI**

```bash
# Set each secret individually
wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
wrangler secret put KEYSTATIC_SECRET
wrangler secret put PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
wrangler secret put KEYSTATIC_GITHUB_REPO
```

**Method 3: Cloudflare Dashboard**

1. Go to Workers & Pages → Your Worker → Settings → Variables
2. Add each secret under "Environment Variables"
3. Mark as "Encrypted" (secret)

### Verify Secrets

```bash
# List all secrets (values hidden)
wrangler secret list

# Should show all 5 required secrets
```

---

## 🔑 GitHub App Setup (Production Only)

Required for Keystatic to commit to GitHub on production.

### 1. Create GitHub App

1. Go to: https://github.com/settings/apps/new
2. Fill in:
   - **App name:** `my-astro-keystatic` (or unique name)
   - **Homepage URL:** `https://your-worker-domain.workers.dev`
   - **Callback URL:** `https://your-worker-domain.workers.dev/api/keystatic/github/oauth/callback`
   
   ⚠️ **CRITICAL:** Callback URL must match your Worker domain exactly!

3. **Permissions:**
   - Repository contents: **Read and write**
   - Repository metadata: **Read-only**

4. **Where can this be installed?**
   - Select: **Only on this account**

5. Click **Create GitHub App**

### 2. Get Credentials

- **Client ID:** Copy from app settings page
- **Client Secret:** Click "Generate a new client secret" → Copy immediately
- **App Slug:** Found in URL: `github.com/apps/YOUR-APP-SLUG`

### 3. Install App

1. App settings → "Install App"
2. Select your account
3. Choose **Only select repositories** → Select your repo
4. Click "Install"

📖 **Detailed guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔐 KV Namespace Security

Keystatic uses a KV namespace for session storage.

### Creating KV Namespace

```bash
# Create namespace
wrangler kv:namespace create SESSION

# Copy the namespace ID from output
# Update wrangler.jsonc with the ID
```

### Security Considerations

- **Session data:** Contains OAuth tokens, user sessions
- **Encrypted:** Cloudflare KV data is encrypted at rest
- **Access:** Only your Worker can access this KV namespace
- **Cleanup:** Sessions expire automatically (Keystatic handles TTL)

### Binding Security

In `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSION",  // Must match Keystatic's expectation
    "id": "your-kv-id"     // Replace with actual ID
  }
]
```

⚠️ **Never commit KV namespace ID if it contains sensitive data** - though the ID itself isn't secret, keep it in your config.

---

## 🚨 If Credentials Are Exposed

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

---

## ✅ Production Deployment Checklist

Before deploying to production:

- [ ] All 5 required secrets set in Cloudflare Worker
- [ ] .env and .dev.vars are in .gitignore
- [ ] No secrets in code or config files
- [ ] GitHub App created and configured correctly
- [ ] GitHub App installed on repository
- [ ] KV namespace created and bound in wrangler.jsonc
- [ ] Callback URL matches production domain exactly
- [ ] KEYSTATIC_SECRET is at least 32 characters
- [ ] Tested npm run deploy:check passes

---

## 🛡️ Best Practices

### DO ✅

- Use wrangler secret put for all production secrets
- Generate strong secrets: openssl rand -hex 32
- Keep .env and .dev.vars in .gitignore
- Rotate secrets immediately if exposed
- Use different secrets for dev and production

### DON'T ❌

- Never commit .env or .dev.vars to git
- Never share secrets via email, Slack, or other channels
- Never use placeholder values in production
- Never set secrets as regular environment variables in wrangler.jsonc
