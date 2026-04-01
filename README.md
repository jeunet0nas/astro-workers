# my-astro-app

Astro 6, Cloudflare Workers adapter, blog và trang tĩnh qua [Keystatic](https://keystatic.com/).

## 🚀 Quick Start

### Local Development (Đơn giản)

```sh
# 1. Cài đặt dependencies
npm install

# 2. (Optional) Copy .env.example nếu cần tùy chỉnh
cp .env.example .env

# 3. Chạy dev server
npm run dev
```

**Keystatic tự động chạy ở chế độ local** - không cần setup GitHub App cho development!

- Site: `http://127.0.0.1:4321`
- Keystatic CMS: `http://127.0.0.1:4321/keystatic`

### Production Deployment (Chi tiết)

Để deploy lên Cloudflare Workers với Keystatic GitHub integration:

```sh
# 1. Setup GitHub App và secrets
npm run deploy:secrets  # Interactive setup wizard

# 2. Tạo KV namespace cho sessions
wrangler kv:namespace create SESSION
# Cập nhật ID vào wrangler.jsonc

# 3. Deploy
npm run deploy
```

📖 **Xem hướng dẫn đầy đủ:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔐 Bảo mật quan trọng

- ❌ **KHÔNG BAO GIỜ** commit file `.env` hoặc `.dev.vars`
- ✅ Secrets cho production: dùng `wrangler secret put`
- ✅ Generate secret mạnh: `openssl rand -hex 32`

📖 **Chi tiết:** [SECURITY.md](./SECURITY.md)

---

## 📁 Nội dung & Cấu trúc

### Collections

| Collection | Thư mục | URL | Mục đích |
|------------|---------|-----|----------|
| Blog posts | `src/content/posts/` | `/blog/[slug]` | Bài viết blog |
| Pages | `src/content/pages/` | `/[slug]` | Trang tĩnh |
| Site pages | `src/content/site-pages/` | `/`, `/blog` | Trang chủ, blog index |

### Post metadata (Astro + Keystatic sync)

Các field dưới đây phải luôn đồng bộ giữa `src/content.config.ts` và `keystatic.config.ts`:

- `title` (string)
- `publishDate` (date)
- `summary` (string, optional)
- `draft` (boolean)
- `coverImage` (image, optional)
- `featured` (boolean)
- `category` (string)
- `tags` (string array)
- `readingTime` (number, optional)

### Images

Ảnh được lưu trong:
- `src/assets/images/posts/` - Blog post images
- `src/assets/images/pages/` - Page images

Keystatic tự động xử lý upload qua editor.

---

## 🎯 Storage Modes (Tự động)

Dự án **tự động phát hiện môi trường** và chọn storage mode phù hợp:

### 🏠 Local Development
- **Chế độ:** `local` (tự động)
- **Hoạt động:** Keystatic edit files trực tiếp trên filesystem
- **Không cần:** GitHub App, KV namespace
- **Dùng cho:** Development, content editing nhanh

### ☁️ Production (Cloudflare Workers)
- **Chế độ:** `github` (tự động)
- **Hoạt động:** Keystatic commit vào GitHub qua OAuth
- **Yêu cầu:** GitHub App, KV namespace, secrets
- **Dùng cho:** Deployed site, collaborative editing

**Không cần set `KEYSTATIC_STORAGE_KIND` manually** - tự động detect!

---

## 🛠️ Scripts

```sh
# Development
npm run dev              # Dev server (local mode)
npm run build            # Production build
npm run preview          # Build & preview locally
npm run content:check    # Validate post frontmatter schema sync

# Deployment
npm run deploy           # content:check + build + deploy to Workers
npm run deploy:check     # Validate config before deploy
npm run deploy:secrets   # Interactive secrets setup

# Types
npm run generate-types   # Generate Cloudflare types
```

---

## 🔄 Đồng bộ Astro-Keystatic

Để tránh lỗi Keystatic không hiện field mới nhưng Astro vẫn render field đó:

1. Khi thêm/sửa field trong `posts`, cập nhật **đồng thời**:
   - `src/content.config.ts`
   - `keystatic.config.ts`
2. Chạy `npm run content:check` trước commit/deploy.
3. Nếu check fail, sửa frontmatter tại `src/content/posts/*.mdoc` cho đúng kiểu dữ liệu.

`deploy` và `deploy:check` đã tự chạy `content:check` để chặn deploy khi schema/content lệch.

---

## ⚙️ Cấu hình đặc biệt

### Conditional Adapter

`astro.config.mjs` tắt Cloudflare adapter khi `npm run dev` để Keystatic hoạt động. Production builds vẫn dùng adapter bình thường.

**Lý do:** Cloudflare dev mode dùng esbuild, không resolve `virtual:keystatic-config`.

### Astro 6 + Keystatic Compatibility

- Keystatic chưa official support Astro 6
- `.npmrc` có `legacy-peer-deps=true` để install được
- Chờ Keystatic update hoặc dùng như hiện tại

### Windows Patch

`patches/astro+6.1.2.patch` fix lỗi concurrent writes vào `.astro/data-store.json` trên Windows. Auto-applied qua `postinstall`.

---

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide (chi tiết)
- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Codebase conventions

---

## 🐛 Troubleshooting

### Keystatic không load trên production?

1. Check Worker logs: `wrangler tail`
2. Verify secrets: `wrangler secret list`
3. Check KV binding trong `wrangler.jsonc`
4. Xem [DEPLOYMENT.md](./DEPLOYMENT.md) - Troubleshooting section

### OAuth callback error?

GitHub App callback URL phải match **chính xác** với Worker domain:
```
https://your-worker.workers.dev/api/keystatic/github/oauth/callback
```

### Local dev không chạy?

```sh
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check Astro version
npm list astro  # Should be 6.1.2
```

---

## 📚 Resources

- [Astro Documentation](https://docs.astro.build/)
- [Keystatic Documentation](https://keystatic.com/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
