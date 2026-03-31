# my-astro-app

Astro 6, Cloudflare Workers adapter, blog và trang tĩnh qua [Keystatic](https://keystatic.com/).

## ⚠️ Bảo mật quan trọng

**Trước khi bắt đầu, đọc [SECURITY.md](./SECURITY.md) để thiết lập đúng credentials!**

- ❌ **KHÔNG BAO GIỜ** commit file `.env` hoặc `.dev.vars`
- ✅ Sử dụng `.env.example` và `.dev.vars.example` làm template
- ✅ Generate secret mới: `openssl rand -hex 32`

## Chạy local

```sh
# 1. Cài đặt dependencies
npm install

# 2. Thiết lập environment variables
cp .env.example .env
# Chỉnh sửa .env với giá trị thực của bạn

# 3. Chạy dev server
npm run dev
```

- Site: `http://127.0.0.1:4321` (hoặc port khác nếu Astro báo “Port … is in use”).
- Keystatic: `http://127.0.0.1:4321/keystatic` (cùng port với dev).

Trong `astro.config.mjs`, adapter Cloudflare **tắt khi `npm run dev`** để Keystatic hoạt động (dev Cloudflare dùng esbuild và không resolve `virtual:keystatic-config`). **`npm run build`** / **`npm run preview`** vẫn dùng adapter như khi deploy.

## Nội dung

| Collection | Thư mục              | URL public      |
|------------|----------------------|-----------------|
| Blog       | `src/content/posts/` | `/blog/[slug]`  |
| Pages      | `src/content/pages/` | `/[slug]`     |
| Site pages | `src/content/site-pages/` | `/` va `/blog` (noi dung + nav) |

Ảnh upload trong editor: `src/assets/images/posts/` và `src/assets/images/pages/` (đã cấu hình trong `keystatic.config.ts`).

`site-pages/home` va `site-pages/blog` dung de quan ly noi dung trang chu/trang blog va nhan menu tu Keystatic.

Sau khi đổi nội dung: `npm run build`, rồi `npm run deploy` (hoặc `wrangler deploy`) như trước.

## Tao lai Worker (de nghi)

Neu ban xoa worker hien tai, hay tao lai bang Wrangler thay vi dashboard Git deploy:

1. `npm install`
2. `npx wrangler login`
3. `npm run deploy`

Script deploy dung config do Astro tao ra: `dist/server/wrangler.json`.

### Keystatic tren production (GitHub mode)

De `/keystatic` hoat dong khi deploy worker, set cac bien moi truong tren Cloudflare Worker:

- `KEYSTATIC_STORAGE_KIND=github`
- `KEYSTATIC_GITHUB_REPO=jeunet0nas/astro-workers`
- `KEYSTATIC_GITHUB_CLIENT_ID=...`
- `KEYSTATIC_GITHUB_CLIENT_SECRET=...`
- `KEYSTATIC_SECRET=...`
- `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...`

Khong commit cac gia tri secret vao repo.

## Ghi chú

- `@keystatic/astro` khai báo peer `astro@2–5`; dự án dùng Astro 6 nên repo có `.npmrc` với `legacy-peer-deps=true` để cài dependency ổn định. Nếu có bản Keystatic hỗ trợ Astro 6 chính thức, có thể bỏ cài đặt này.

- **Patch `astro`:** lưu trong `patches/astro+6.1.2.patch` — ghi `.astro/data-store.json` dùng file `.tmp` tên ngẫu nhiên để tránh lỗi `ENOENT ... rename ... data-store.json.tmp` trên Windows khi Keystatic lưu bài kèm ảnh (nhiều lần ghi nội dung collections gần nhau). `npm install` chạy `patch-package` qua `postinstall`.

## Tài liệu kế hoạch

Xem `docs/keystatic-blog-development-plan.md` (checklist và mở rộng sau v1).
