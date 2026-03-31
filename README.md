# my-astro-app

Astro 6, Cloudflare Workers adapter, blog và trang tĩnh qua [Keystatic](https://keystatic.com/).

## Chạy local

```sh
npm install
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

## Ghi chú

- `@keystatic/astro` khai báo peer `astro@2–5`; dự án dùng Astro 6 nên repo có `.npmrc` với `legacy-peer-deps=true` để cài dependency ổn định. Nếu có bản Keystatic hỗ trợ Astro 6 chính thức, có thể bỏ cài đặt này.

- **Patch `astro`:** lưu trong `patches/astro+6.1.2.patch` — ghi `.astro/data-store.json` dùng file `.tmp` tên ngẫu nhiên để tránh lỗi `ENOENT ... rename ... data-store.json.tmp` trên Windows khi Keystatic lưu bài kèm ảnh (nhiều lần ghi nội dung collections gần nhau). `npm install` chạy `patch-package` qua `postinstall`.

## Tài liệu kế hoạch

Xem `docs/keystatic-blog-development-plan.md` (checklist và mở rộng sau v1).
