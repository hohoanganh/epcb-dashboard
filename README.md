# EPCB Project Dashboard

Dashboard quản lý dự án phần cứng nội bộ cho **EPCB Vietnam** — Hardware Engineering Team.

🔗 **Live:** [hohoanganh.github.io/epcb-dashboard](https://hohoanganh.github.io/epcb-dashboard/)

---

## Tính năng

### 📋 Tổng quan
- Bảng danh sách dự án đang chạy (ẩn dự án đã lưu trữ)
- 4 thẻ thống kê có thể click để lọc: **Tổng dự án / Critical-Cao / Tiến độ TB / Hoàn thành**
- Chỉ tính dự án đang active (không tính archived)
- Click vào hàng để xem chi tiết dự án

### 📊 Báo cáo
- Progress bars theo nhóm (Sản xuất / SP mới / R&D...)
- Chỉ tính dự án đang chạy, ẩn dự án đã lưu trữ
- Nút in PDF

### 📅 Timeline (Gantt Chart)
- Gantt chart nhiều giai đoạn xếp dọc trong mỗi hàng dự án
- Mỗi dự án có thanh tổng tiến độ + các thanh giai đoạn con màu sắc riêng
- Nhãn "Hôm nay" cố định trên header tháng, không bị che
- Dự án archived không hiển thị trên Gantt
- Danh sách mốc quan trọng — sắp xếp: sắp tới gần nhất lên đầu
- Click vào thanh/mốc → popup thông tin chi tiết

### 🗂 Chi tiết dự án
- Kéo slider hoặc nhấn nút nhanh (0/25/50/75/90/100%)
- Pill button compact cho Trạng thái / Mức rủi ro / Deadline
- **Timeline dự án** đặt ưu tiên lên đầu với thanh progress thời gian trực quan
- Click chấm mốc trên thanh → popup tên, ngày, trạng thái, nút chỉnh sửa
- Google Drive links cho file thiết kế (Schematic, BOM, KiCad...)
- Ghi chú / Action items
- Lưu trữ dự án đã hoàn thành (Admin only)

### 📅 Giai đoạn & công việc con
- Mỗi dự án có nhiều **giai đoạn** (vd: Đặt PCB, Lắp ráp, Test...)
- Mỗi giai đoạn có ngày bắt đầu + ngày kết thúc + màu sắc riêng
- Mỗi giai đoạn có **công việc con** (sub-tasks): tên + deadline + trạng thái
- Trạng thái sub-task: 📋 Todo / 🔄 Đang làm / ✅ Done
- Click giai đoạn để expand/collapse danh sách công việc con
- Badge `✓ 2/5` hiện tiến độ sub-tasks ngay trên giai đoạn

### 📦 Lưu trữ
- Admin archive dự án Done → ẩn khỏi sidebar, bảng, báo cáo, Gantt
- Nút "📦 X lưu trữ" ở sidebar footer để xem/ẩn dự án archived

---

## Phân quyền

| | 👁 Viewer | ✏️ Editor | 🔑 Admin |
|---|:---:|:---:|:---:|
| Xem toàn bộ | ✅ | ✅ | ✅ |
| Cập nhật tiến độ, trạng thái, ghi chú | ❌ | ✅ | ✅ |
| Chỉnh sửa timeline, giai đoạn, sub-tasks | ❌ | ✅ | ✅ |
| Thêm Drive links | ❌ | ✅ | ✅ |
| Thêm / Xóa / Lưu trữ dự án | ❌ | ❌ | ✅ |

- **Viewer** — vào thẳng, không cần mật khẩu
- **Editor / Admin** — nhấn badge role → nhập mật khẩu → Apps Script xác thực
- Mật khẩu **không lưu trong HTML** — lưu trong `Code.gs` (server-side)
- Session role mất khi đóng tab

---

## Bảo mật

Mật khẩu được xác thực **server-side** qua Google Apps Script:

```
User nhập pass
    → Dashboard gửi lên Apps Script (JSONP)
    → Apps Script so sánh với PASS_EDITOR / PASS_ADMIN
    → Trả về role nếu đúng
    → HTML không chứa pass, xem source cũng không thấy
```

**Đổi mật khẩu:** Chỉ cần sửa 2 dòng trong `Code.gs` rồi deploy lại:
```js
const PASS_EDITOR = "pass_mới_editor";
const PASS_ADMIN  = "pass_mới_admin";
```

---

## Kiến trúc

```
GitHub Pages (index.html)  ← frontend public
        ↕ JSONP
Google Apps Script (Code.gs)  ← backend, chứa pass
        ↕
Google Sheets  ← database
  ├── Sheet "Projects"      ← dữ liệu gốc
  └── Sheet "Timeline View" ← view đẹp tự động cập nhật
```

### Cấu trúc cột Sheet Projects

| Cột | Nội dung |
|---|---|
| id | ID dự án |
| name | Tên dự án |
| group | Nhóm (Sản xuất / R&D / SP mới...) |
| status | Trạng thái |
| deadline | Deadline (dd/mm/yyyy) |
| pct | Tiến độ % |
| risk | Mức rủi ro (critical/high/mid/low) |
| owner | Người phụ trách |
| notes | Ghi chú (có flag `@@ARCHIVED@@` nếu đã archive) |
| links | JSON array các Google Drive links |
| timeline | JSON chứa start, end, milestones (giai đoạn + sub-tasks) |
| updated_at | Thời gian cập nhật cuối |

---

## Cài đặt từ đầu

### 1. Google Sheets
- Tạo Google Sheet mới
- Mở **Extensions → Apps Script**
- Paste nội dung `Code.gs` → **Save**
- Đổi `PASS_EDITOR` và `PASS_ADMIN` theo ý muốn
- **Deploy → New deployment → Web app**
  - Execute as: **Me**
  - Who has access: **Anyone**
- Copy URL deployment

### 2. index.html
- Tìm dòng `const SCRIPT_URL` → thay bằng URL vừa copy
- Push lên GitHub repo → bật **GitHub Pages** từ branch `main`

### 3. Cập nhật Code.gs (không mất dữ liệu)
1. Paste code mới vào Apps Script → **Save**
2. **Deploy → Manage deployments → ✏️ Edit → New version → Deploy**
3. ⚠️ **Không** tạo "New deployment" — URL sẽ thay đổi

---

## Công nghệ

| | |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, font Inter + JetBrains Mono |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Hosting | GitHub Pages |
| Auth | Server-side qua Apps Script (pass không public) |
| Giao tiếp | JSONP (bypass CORS) |

---

## Ghi chú kỹ thuật

- Timeline/giai đoạn lưu trong cột `timeline` (JSON) — bao gồm `milestones[].tasks[]` (sub-tasks)
- Drive links lưu trong cột `links` (JSON array)
- Dữ liệu cũ (milestone chỉ có `date`) tự migrate sang `start`/`end` khi mở modal
- Dự án archived vẫn còn trong Sheet, chỉ ẩn trên dashboard
- Session role không persist — đóng tab về Viewer

---

*EPCB Vietnam — Hardware Engineering Team*
