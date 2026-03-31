# Kế hoạch phát triển: Astro + Keystatic (blog) trên Cloudflare Workers

Tài liệu này tổng kết **hướng đi**, **giả định**, và **các bước thực hiện** đã thống nhất qua trao đổi. Dùng làm tiêu chí phát triển và đối chiếu tiến độ (kể cả khi làm việc với Cursor).

---

## 1. Mục tiêu

- Tích hợp **Keystatic** làm CMS gắn với repo (file Markdown/MDX trong project).
- Hiển thị **blog**: danh sách bài, trang chi tiết, dễ mở rộng (RSS, tag, v.v. sau này).
- Giữ stack hiện tại: **Astro 6**, adapter **Cloudflare**, deploy **Worker** (hiện: build + deploy từ máy).

---

## 2. Ngữ cảnh kỹ thuật

| Hạng mục | Giá trị / ghi chú |
|----------|-------------------|
| Framework | Astro 6 |
| Deploy | Cloudflare Workers (`astro build` + `wrangler deploy`) |
| Nguồn nội dung | File trong repo (Keystatic chỉnh schema + UI chỉnh sửa) |
| Render blog | **Build-time** (Content Collections / đọc file lúc build), không phụ thuộc DB runtime trên Worker |

---

## 3. Nguyên tắc nội dung và deploy

### 3.1 Cập nhật nội dung và “render mới”

- Bản chất: **thay đổi nằm trong Git (file content)** → **build lại** → **deploy** thì site mới phản ánh đầy đủ.
- **Keystatic chế độ GitHub (production):** UI tạo commit qua API; sau đó vẫn cần pipeline hoặc bạn **build + deploy** (hoặc CI) — không thay thế bước build.

### 3.2 Deploy từ máy (hiện trạng)

- **Không bắt buộc** chuyển sang chỉ deploy từ Git/CI để dùng Keystatic.
- Điều kiện: trước khi `astro build`, trên máy phải có **đủ file nội dung mới** trong project.
- **Khuyến nghị:** vẫn `git commit` (và push nếu có remote) để **backup**, lịch sử, làm việc đa máy — tránh mất bài khi chỉ deploy tay mà không lưu repo.

---

## 4. Rủi ro / quyết định cần khóa trước khi code

- **Keystatic + adapter Cloudflare:** xác minh phiên bản `@keystatic/*` tương thích Astro 6; route `/keystatic` trên Worker (nếu bật online).
- **Chỉnh sửa trên production:** Worker **không** có filesystem ghi được như máy dev — nếu cần admin online, dùng **GitHub storage** + biến môi trường; nếu không, **chỉ dùng Keystatic khi `astro dev`** rồi commit + deploy.
- **Bảo mật:** token GitHub chỉ qua env Cloudflare, không commit.

**Quyết định đề xuất cho phiên bản đầu (MVP):**

- Biên soạn chủ yếu **local** (`astro dev`), commit nội dung, deploy từ máy — đơn giản, ít rủi ro.
- Bật Keystatic GitHub trên production **chỉ khi** có nhu cầu rõ ràng và đã có checklist bảo mật.

---

## 5. Lộ trình thực hiện (checklist)

Dùng làm tiêu chí “xong từng giai đoạn”.

### Giai đoạn A — Nền tảng Keystatic

- [x] Cài `@keystatic/core`, `@keystatic/astro` (và dependency field/markdown theo doc phiên bản đang dùng).
- [x] Thêm integration vào `astro.config.mjs` (cùng `cloudflare()`).
- [x] Tạo `keystatic.config.*`: collection `posts` với các field tối thiểu (ví dụ: `title`, `slug`, `publishedDate`, `summary`, body).
- [x] Thống nhất thư mục lưu bài (ví dụ `src/content/posts/`) và đảm bảo Keystatic ghi đúng chỗ đó.

### Giai đoạn B — Blog hiển thị (Astro)

- [x] Định nghĩa Content Collection + schema **khớp** field Keystatic.
- [x] Trang `/blog`: liệt kê bài, sắp xếp theo ngày, ẩn draft nếu có field đó.
- [x] Trang chi tiết động `/blog/...`: render Markdown/MDX và metadata.
- [x] Tùy chọn: layout prose, metadata SEO cơ bản.
- [x] (v1) Collection **Pages** + route `/p/[slug]`; ảnh cover + ảnh trong Markdoc.

### Giai đoạn C — Trải nghiệm & deploy

- [x] `astro build` local không lỗi; `wrangler deploy` như hiện tại.
- [ ] Kiểm tra route `/keystatic` (dev; và production nếu bật).
- [x] Ghi chú ngắn trong README: cách thêm bài, cách build/deploy (1–2 đoạn, tránh dài dòng).

### Giai đoạn D — Mở rộng (sau MVP)

- [ ] RSS feed.
- [ ] Tag/category, author (v1 đã có cover + ảnh trong Markdoc).
- [ ] CI deploy từ Git (GitHub Actions + Wrangler) nếu muốn bỏ deploy tay.
- [ ] Keystatic GitHub mode trên production (nếu chọn).

---

## 6. Định nghĩa “hoàn thành MVP”

- Có thể tạo/sửa bài trong Keystatic khi dev, file nằm trong repo.
- Trang blog public hiển thị đúng danh sách và từng bài.
- Quy trình: chỉnh nội dung → (khuyến nghị) commit → `astro build` → `wrangler deploy` từ máy → nội dung mới lên Worker.

---

## 7. Cách dùng tài liệu này trong Cursor

- Coi các mục **mục 5 (Lộ trình)** là backlog có thể tick dần.
- Khi nhờ agent implement: tham chiếu file này và giai đoạn đang làm (A/B/C…).
- Nếu đổi quyết định (ví dụ bắt buộc admin online ngay từ MVP), cập nhật **mục 4 (Rủi ro / quyết định)** và checklist tương ứng rồi mới code.

---

## Phụ lục: Tasklist phiên bản 1 (đã triển khai)

Tiêu chí “blog + Keystatic + ảnh đơn giản + thêm page” (kiểm tra trong repo):

| # | Việc | Trạng thái |
|---|------|------------|
| 1 | Cài `@astrojs/react`, `@astrojs/markdoc`, `@keystatic/core`, `@keystatic/astro`; `.npmrc` `legacy-peer-deps` (Astro 6) | Hoàn thành |
| 2 | `keystatic.config.ts`: collections `posts` (title, publishDate, summary, draft, coverImage, markdoc + ảnh trong body), `pages` (title, markdoc + ảnh) | Hoàn thành |
| 3 | `src/content.config.ts` + `glob` loader, schema khớp Keystatic | Hoàn thành |
| 4 | `markdoc.config.mjs` + `MarkdocImage.astro` cho ảnh trong nội dung | Hoàn thành |
| 5 | Trang `/blog`, `/blog/[slug]`, `/p/[slug]`; layout + nav | Hoàn thành |
| 6 | Mẫu `welcome.mdoc`, `about.mdoc`; thư mục ảnh `src/assets/images/{posts,pages}/` | Hoàn thành |
| 7 | README ngắn: dev, `/keystatic`, build/deploy | Hoàn thành |

Việc còn lại theo mục 5 gốc (RSS, CI, GitHub mode…) giữ nguyên cho các phiên bản sau.

---

*Tạo để làm tiêu chuẩn phát triển có thể kiểm tra và chỉnh sửa theo tiến độ thực tế.*
