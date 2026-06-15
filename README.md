# EPCB Project Dashboard

Dashboard quản lý dự án phần cứng nội bộ cho **EPCB Vietnam** — Hardware Engineering Team.

🔗 **Live:** [hohoanganh.github.io/epcb-dashboard](https://hohoanganh.github.io/epcb-dashboard/)

---

## Tính năng

### 📋 Tổng quan
- Bảng danh sách dự án đang chạy (ẩn dự án đã lưu trữ)
- 4 thẻ thống kê: Tổng dự án / Critical-Cao / Tiến độ TB / Hoàn thành
- Click vào thẻ để lọc nhanh theo loại
- Click vào hàng để xem chi tiết dự án

### 📊 Báo cáo
- Progress bars theo nhóm (Sản xuất / SP mới / R&D...)
- Chỉ tính dự án đang chạy, không tính dự án đã lưu trữ
- Nút in PDF

### 📅 Timeline
- Gantt chart hiển thị tiến độ theo thời gian
- Đường "Hôm nay" hiển thị 1 lần duy nhất
- Danh sách milestones sắp xếp: sắp tới gần nhất lên đầu

### 🗂 Chi tiết dự án
- Kéo slider hoặc nhấn nút nhanh (0/25/50/75/90/100%) để cập nhật tiến độ
- Chọn trạng thái và mức rủi ro bằng pill button
- Timeline dự án với progress bar thời gian, highlight milestone sắp tới
- Google Drive links cho file thiết kế (Schematic, BOM, KiCad...)
- Ghi chú / Action items
- Lưu trữ dự án đã hoàn thành (chỉ Admin)

---

## Phân quyền

| | 👁 Viewer | ✏️ Editor | 🔑 Admin |
|---|:---:|:---:|:---:|
| Xem toàn bộ | ✅ | ✅ | ✅ |
| Cập nhật tiến độ, trạng thái, ghi chú | ❌ | ✅ | ✅ |
| Chỉnh sửa timeline & Drive links | ❌ | ✅ | ✅ |
| Thêm / Xóa / Lưu trữ dự án | ❌ | ❌ | ✅ |

- **Viewer** — vào thẳng, không cần mật khẩu
- **Editor / Admin** — nhấn badge role → nhập mật khẩu

> Mật khẩu được cấu hình trực tiếp trong `index.html` tại 2 dòng:
> ```js
> const PASS_EDITOR = "...";
> const PASS_ADMIN  = "...";
> ```

---

## Kiến trúc

```
GitHub Pages (index.html)
        ↕ JSONP
Google Apps Script (Code.gs)
        ↕
Google Sheets (Projects + Timeline View)
```

| Thành phần | Mô tả |
|---|---|
| `index.html` | Single-file frontend — HTML + CSS + JS |
| `Code.gs` | Google Apps Script backend |
| Sheet `Projects` | Dữ liệu gốc: id, name, group, status, deadline, pct, risk, owner, notes, links, timeline |
| Sheet `Timeline View` | View đẹp tự động cập nhật khi lưu timeline |

---

## Cài đặt

### 1. Google Sheets
- Tạo Google Sheet mới
- Mở **Extensions → Apps Script**
- Paste nội dung `Code.gs` → **Save**
- **Deploy → New deployment → Web app**
  - Execute as: **Me**
  - Who has access: **Anyone**
- Copy URL deployment

### 2. index.html
- Mở file, tìm dòng `const SCRIPT_URL` → thay bằng URL vừa copy
- Đặt mật khẩu tại `PASS_EDITOR` và `PASS_ADMIN`
- Push lên GitHub repo, bật **GitHub Pages** từ branch `main`

### 3. Cập nhật Code.gs
Khi có phiên bản mới:
- Paste code mới vào Apps Script → **Save**
- **Deploy → Manage deployments → Edit → New version → Deploy**
- ⚠️ Không tạo deployment mới — URL sẽ thay đổi

---

## Công nghệ

- **Frontend:** Vanilla HTML/CSS/JS, font Inter + JetBrains Mono
- **Backend:** Google Apps Script
- **Database:** Google Sheets
- **Hosting:** GitHub Pages
- **Giao tiếp:** JSONP (bypass CORS)

---

## Ghi chú

- Dữ liệu timeline lưu trong cột `timeline` (JSON) của sheet Projects
- Drive links lưu trong cột `links` (JSON array)
- Dự án archived vẫn còn trong sheet, chỉ ẩn khỏi dashboard
- Session role không lưu — đóng tab là về Viewer
- Hoạt động tốt trên mobile (responsive)

---

*EPCB Vietnam — Hardware Engineering Team*
