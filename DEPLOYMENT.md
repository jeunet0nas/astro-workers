# Production Deployment Guide

This guide covers deploying your Astro + Keystatic application to Cloudflare Workers with GitHub integration.

## Overview

**Architecture:**
- **Astro 6** site with SSR (Cloudflare Workers adapter)
- **Keystatic CMS** with GitHub storage mode
- **KV namespace** for session storage (OAuth)
- **GitHub App** for OAuth authentication

**Storage Modes:**
- **Local dev:** Keystatic edits files directly on filesystem
- **Production:** Keystatic commits to GitHub via OAuth

The storage mode is **auto-detected** based on environment. No manual configuration needed.

---

## Prerequisites

Before deploying, you need:

1. ✅ A GitHub account and repository
2. ✅ A Cloudflare account
3. ✅ Wrangler CLI installed: `npm install -g wrangler`
4. ✅ Wrangler authenticated: `wrangler login`

---

## Step 1: Create GitHub App

Keystatic requires a GitHub App for OAuth authentication.

### 1.1 Create the App

1. Go to: https://github.com/settings/apps/new
2. Fill in the form:

   **GitHub App name:** `my-astro-keystatic` (or any unique name)
   
   **Homepage URL:** `https://your-worker-domain.workers.dev` (your deployed site URL)
   
   **Callback URL:** `https://your-worker-domain.workers.dev/api/keystatic/github/oauth/callback`
   
   ⚠️ **CRITICAL:** The callback URL must be exact. Replace `your-worker-domain` with your actual Worker subdomain.

3. **Permissions:**
   - Repository permissions:
     - ✅ **Contents:** Read and write
     - ✅ **Metadata:** Read-only
   
4. **Where can this GitHub App be installed?**
   - Select: **Only on this account**

5. Click **Create GitHub App**

### 1.2 Get Credentials

After creating the app:

1. **Client ID:** Copy the Client ID (shown on app settings page)
2. **Client Secret:** Click "Generate a new client secret" → Copy it immediately (won't show again)
3. **App Slug:** Found in the URL: `github.com/apps/YOUR-APP-SLUG`

### 1.3 Install App on Repository

1. Go to app settings → "Install App"
2. Click "Install" next to your account
3. Select: **Only select repositories** → Choose your repo (e.g., `owner/astro-workers`)
4. Click "Install"

---

## Step 2: Create KV Namespace for Sessions

Keystatic needs a KV namespace to store OAuth sessions.

```bash
# Create KV namespace
wrangler kv namespace create SESSION

# Output will show something like:
# 🌀 Creating namespace with title "my-astro-app-SESSION"
# ✨ Success!
# Add the following to your configuration file in your kv_namespaces array:
# { binding = "SESSION", id = "abc123xyz..." }
```

**Copy the namespace ID** from the output.

### Update wrangler.jsonc

Open `wrangler.jsonc` and replace `YOUR_KV_NAMESPACE_ID` with the actual ID:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSION",
    "id": "abc123xyz..."  // ← Your actual KV namespace ID
  }
]
```

---

## Step 3: Set Environment Variables

Set your secrets in Cloudflare Worker:

```bash
# Set GitHub App Client ID
wrangler secret put KEYSTATIC_GITHUB_CLIENT_ID
# Paste your Client ID when prompted

# Set GitHub App Client Secret
wrangler secret put KEYSTATIC_GITHUB_CLIENT_SECRET
# Paste your Client Secret when prompted

# Generate and set Keystatic secret (min 32 chars)
openssl rand -hex 32  # Generate a random secret
wrangler secret put KEYSTATIC_SECRET
# Paste the generated secret when prompted

# Set GitHub App slug
wrangler secret put PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
# Enter your app slug (e.g., "my-astro-keystatic")

# Set GitHub repository (format: owner/repo)
wrangler secret put KEYSTATIC_GITHUB_REPO
# Enter your repo (e.g., "jeunet0nas/astro-workers")
```

**Alternative: Set via Cloudflare Dashboard**

You can also set these in the Cloudflare dashboard:
1. Go to Workers & Pages → Your Worker → Settings → Variables
2. Add each secret under "Environment Variables"

---

## Step 4: Deploy

Now deploy your application:

```bash
# Build and deploy
npm run deploy
```

This will:
1. Run `astro build` (production build with Cloudflare adapter)
2. Deploy to Cloudflare Workers via `wrangler deploy`

**Expected output:**
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded my-astro-app (X.XX sec)
Published my-astro-app (X.XX sec)
  https://my-astro-app.workers.dev
```

---

## Step 5: Test Keystatic on Production

### 5.1 Access Keystatic UI

1. Navigate to: `https://your-worker-domain.workers.dev/keystatic`
2. You should see the Keystatic login page

### 5.2 Test GitHub OAuth

1. Click **"Sign in with GitHub"**
2. You'll be redirected to GitHub for authorization
3. Click **"Authorize"** to grant access
4. You should be redirected back to Keystatic UI

### 5.3 Test Content Editing

1. In Keystatic UI, navigate to "Blog posts" or "Pages"
2. Create or edit an entry
3. Click **"Save"**
4. Keystatic will commit the changes to your GitHub repository
5. Check your GitHub repo - you should see the new commit

---

## Troubleshooting

### ❌ Blank Page at /keystatic

**Possible causes:**
- Missing environment variables
- KV namespace not bound correctly
- GitHub App callback URL mismatch

**Solutions:**
1. Check Worker logs: `wrangler tail`
2. Verify all secrets are set: `wrangler secret list`
3. Check KV binding in `wrangler.jsonc`
4. Verify GitHub App callback URL matches your Worker URL exactly

### ❌ OAuth Callback Error

**Error:** "The redirect_uri does not match"

**Solution:** Update GitHub App callback URL:
1. Go to GitHub App settings
2. Update Callback URL to match your Worker domain exactly
3. Format: `https://your-worker-domain.workers.dev/api/keystatic/github/oauth/callback`

### ❌ "KEYSTATIC_GITHUB_REPO is required" Error

**Solution:**
```bash
wrangler secret put KEYSTATIC_GITHUB_REPO
# Enter: owner/repo (e.g., "jeunet0nas/astro-workers")
```

### ❌ Session Storage Errors

**Error:** "SESSION binding not found"

**Solution:**
1. Create KV namespace: `wrangler kv:namespace create SESSION`
2. Update `wrangler.jsonc` with the namespace ID
3. Redeploy: `npm run deploy`

### ❌ GitHub API Rate Limiting

**Error:** 403 Forbidden from GitHub API

**Solution:**
- GitHub App is not installed on your repository
- Go to GitHub App settings → Install App → Select your repo

---

## View Logs

To debug issues, view real-time Worker logs:

```bash
wrangler tail
```

Then access `/keystatic` on your site and watch the logs.

---

## Update Deployment

To update your site after code changes:

```bash
npm run deploy
```

To update environment variables:

```bash
wrangler secret put VARIABLE_NAME
```

---

## Rollback

If deployment fails, you can rollback via Cloudflare Dashboard:

1. Go to Workers & Pages → Your Worker → Deployments
2. Find previous working deployment
3. Click "···" → "Rollback to this deployment"

---

## Next Steps

- ✅ **Content workflow:** Edit content via `/keystatic` on production
- ✅ **Automatic builds:** Set up CI/CD to auto-deploy on git push
- ✅ **Custom domain:** Configure a custom domain in Cloudflare Dashboard
- ✅ **Preview branches:** Set up branch-specific deployments for testing

---

## Security Checklist

Before going live:

- [ ] All secrets set via `wrangler secret put` (not in code)
- [ ] `.env` and `.dev.vars` are gitignored
- [ ] KEYSTATIC_SECRET is at least 32 characters
- [ ] GitHub App installed on correct repository
- [ ] Callback URL matches production domain exactly
- [ ] KV namespace is bound and accessible

---

## Architecture Notes

### Auto-Detection

The application automatically detects the environment:

**Production indicators:**
- `process.env.CF_PAGES === '1'`
- `process.env.CLOUDFLARE_ENV === 'production'`
- `process.env.NODE_ENV === 'production'`

When production is detected:
- Storage mode: **github** (forced)
- Validation: **strict** (errors on missing secrets)
- Session storage: **KV namespace**

### Session Flow

```
User clicks "Sign in"
  ↓
Redirect to GitHub OAuth
  ↓
User authorizes
  ↓
GitHub redirects to /api/keystatic/github/oauth/callback
  ↓
Keystatic validates and creates session
  ↓
Session stored in KV namespace
  ↓
User authenticated, can edit content
```

### Content Commit Flow

```
User edits content in Keystatic UI
  ↓
User clicks "Save"
  ↓
Keystatic creates Git commit via GitHub API
  ↓
Commit pushed to repository
  ↓
(Optional) Webhook triggers rebuild
```

---

## Need Help?

- **Keystatic docs:** https://keystatic.com/docs
- **Cloudflare Workers docs:** https://developers.cloudflare.com/workers/
- **Astro Cloudflare adapter:** https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- **Check SECURITY.md** for credential management best practices
- **Check README.md** for quick start guide
