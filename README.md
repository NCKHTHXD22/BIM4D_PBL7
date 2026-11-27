# Mô phỏng thi công 4D – TTYT huyện Kỳ Sơn (PBL7 – Nhóm 1)

**Xem trực tuyến (GitHub Pages):** https://nckhthxd22.github.io/BIM4D_PBL7/

Trang web Three.js mô phỏng tiến độ thi công theo `TienDo_ToanBo_nhom1_v2` (15/02/2027 → 13/12/2027).
Mô hình xuất từ Revit (`CKBIM_v2_R2025.rvt`) → FBX → GLB (instancing + meshopt).

- **▶ Chạy** + chọn tốc độ (1 giờ/giây → 20 ngày/giây), **◀ Ngày / Ngày ▶**, thanh thời gian
- Bảng **Thông tin thi công**: ngày, giờ, thời tiết, ngày nghỉ, công việc đang làm (% hoàn thành, nhân công)
- **🛰 Tổng quan** (chuột xoay/zoom) · **👷 Giám sát** (W/A/S/D, kéo chuột, Q/E lên xuống tầng)
- **☰ Chi tiết hạng mục**: danh sách công việc theo tiến độ, bật/tắt từng hạng mục 3D
- `?record=1`: chế độ quay video (ẩn giao diện)

## Bật GitHub Pages (làm 1 lần)
Settings → Pages → *Build and deployment* → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.
Sau 1–2 phút trang chạy ở link trên; mỗi lần `git push` trang tự cập nhật.

Chạy local: `npx serve .` rồi mở `http://localhost:3000`. Cũng deploy được bằng Vercel (Framework: Other, không cần build).
