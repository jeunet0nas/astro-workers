# Git Pre-commit Hook for Security

This directory would contain Git hooks to prevent accidental commits of sensitive data.

## Setup (Optional but Recommended)

Install husky for Git hooks:

```bash
npm install --save-dev husky
npx husky init
```

Then copy the pre-commit script:

```bash
cp .husky/pre-commit.example .husky/pre-commit
chmod +x .husky/pre-commit
```

## What it does

The pre-commit hook will:
- Block commits containing `.env` or `.dev.vars` files
- Warn about potential secrets in code (API keys, tokens, etc.)
- Remind you to check your changes

## Manual Check

Before every commit, verify:

```bash
git status
git diff --cached
```

Make sure no sensitive files or data are staged.
