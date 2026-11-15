# Sổ Tay Vận Hành Dự Án: SPHEREx Explorer (Firebase Edition)
**Tệp định danh:** `OPERATIONS_MANUAL.md`  
**Dự án:** NASA SPHEREx Citizen Science Platform — Multi-Mission Transient Explorer  
**Giao diện:** Dark Mode Design - Gray (Tinh giản cho người dùng phổ thông)  
**Kiến trúc:** 2 Phân Hệ (Python Backend ETL -> Firebase Realtime DB -> Firebase Hosting Frontend)  
**Website Trực Tuyến:** 🌐 **[https://nasasspherex.web.app](https://nasasspherex.web.app)**

---

## 1. Địa Chỉ Trực Tuyến & Trạng Thái Hệ Thống

| Thành Phần | Địa Chỉ Trực Tuyến / Endpoint | Trạng Thái |
|---|---|---|
| **Website Khám Phá (Frontend)** | 🌐 **[https://nasasspherex.web.app](https://nasasspherex.web.app)** | ✅ Đã triển khai (Live CDN) |
| **Firebase Realtime Database** | 📡 **`https://nasasspherex-default-rtdb.asia-southeast1.firebasedatabase.app`** | ✅ Đang đồng bộ thời gian thực |
| **Nhánh dữ liệu chính** | `/spherex` (Metadata, Stars, Candidates, NEOSSat) | ✅ Rules mở đọc công cộng |

---

## 2. Tổng Quan Kiến Trúc 2 Phân Hệ

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHÂN HỆ 1: BACKEND (PYTHON)                      │
│                                                                        │
│   [Tính Năng 1: Tải & Xử lý]               [Tính Năng 2: Đẩy Firebase] │
│   • SPHEREx 102 băng (3 Epochs)           • Đẩy lên Realtime Database  │
│   • Sao nền & Vector Gaia DR3      ───►    • Nhánh: /spherex           │
│   • Vệt quỹ đạo CSA NEOSSat                • Chuẩn hóa JSON Metadata   │
│   • Thuật toán trừ ảnh Dipole              • Hỗ trợ REST & Admin SDK   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       HTTP PUT /spherex.json (0.7s)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FIREBASE REALTIME DATABASE (CLOUD)                   │
│         https://nasasspherex-default-rtdb.asia-southeast1...          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                          WebSocket / EventStream
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  PHÂN HỆ 2: FRONTEND (HTML / CSS / JS)                 │
│                                                                        │
│   • Triển khai trên Firebase Hosting: https://nasasspherex.web.app     │
│   • Phong cách Dark Mode Design - Gray tinh giản cho người phổ thông   │
│   • Lắng nghe realtime từ Firebase DB (db.ref('spherex').on('value')) │
│   • Không bao giờ bị màn hình trắng (cơ chế Zero-Failure Fallback)     │
│   • Bộ điều khiển 1-chạm: Phát chuyển động, Tô màu Đỏ/Xanh, Trừ nền   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Cài Đặt Môi Trường (Prerequisites & Setup)

### 3.1 Yêu cầu hệ thống
- **Python**: 3.10 trở lên (khuyên dùng Python 3.11 hoặc 3.14).
- **Firebase CLI**: `firebase-tools` (kiểm tra bằng `firebase --version`).
- **Trình duyệt**: Google Chrome, Microsoft Edge, Mozilla Firefox hoặc Safari.

### 3.2 Cài đặt thư viện Python
```bash
pip install -r requirements.txt
```
*Các gói cốt lõi gồm: `astropy`, `numpy`, `scipy`, `requests`, `firebase-admin`, `pillow`, `fastapi`, `uvicorn`.*

---

## 4. Vận Hành Backend (Python) — 2 Tính Năng Cốt Lõi

Tệp điều khiển trung tâm là `run_backend.py` (nằm ở thư mục gốc của dự án).

### 4.1 Chạy cả 2 tính năng liên hoàn (Khuyên dùng)
Tự động tải dữ liệu thiên văn 3 epoch, xử lý trắc quang, phân loại phổ 102 băng và đẩy ngay lên Firebase Realtime Database:
```bash
python run_backend.py
# hoặc:
python run_backend.py --download-and-push
```

### 4.2 Chỉ chạy Tính năng 1: Tải dữ liệu về và xử lý
Tải dữ liệu 3 epoch, sao nền Gaia DR3, vệt NEOSSat và lưu bản sao lưu cục bộ vào `backend/data/spherex_synced_data.json`:
```bash
python run_backend.py --download
```

### 4.3 Chỉ chạy Tính năng 2: Đẩy dữ liệu lên Firebase
Đọc dữ liệu đã xử lý từ bộ nhớ đệm và đẩy lên Firebase Realtime Database:
```bash
python run_backend.py --push
```

### 4.4 Tùy biến tham số vùng trời hoặc URL Firebase
```bash
python run_backend.py --ra 90.0 --dec -66.5606 --firebase-url "https://nasasspherex-default-rtdb.asia-southeast1.firebasedatabase.app"
```

---

## 5. Vận Hành Frontend (HTML / JS trên Firebase)

### 5.1 Trải nghiệm trực tuyến qua Firebase Hosting
Website đã được triển khai hoàn tất trên CDN toàn cầu của Firebase:
🌐 **[https://nasasspherex.web.app](https://nasasspherex.web.app)**

### 5.2 Mở trực tiếp trên máy tính cá nhân (Offline / Local)
Bạn có thể mở tệp bất kỳ lúc nào mà **không gặp lỗi màn hình trắng**:
- Mở tệp: [`index.html`](file:///c:/Users/Phamv/OneDrive/Desktop/Planet%20X%20and%20SPHEREx/index.html) hoặc [`frontend/index.html`](file:///c:/Users/Phamv/OneDrive/Desktop/Planet%20X%20and%20SPHEREx/frontend/index.html).
- **Cơ chế hoạt động**:
  - Khi có mạng: Tự động kết nối tới Firebase Realtime Database và lắng nghe dữ liệu trực tiếp từ Backend.
  - Khi mất mạng hoặc chưa cấu hình Firebase: Tự động nạp bộ giả lập thiên văn chuẩn SPHEREx/Gaia/NEOSSat để trải nghiệm mượt mà 100%.

### 5.3 Chạy qua máy chủ thử nghiệm cục bộ (Local Server)
```bash
# Chạy máy chủ HTTP nội bộ qua Python
python -m http.server 8080 --directory frontend

# Truy cập trình duyệt:
# http://localhost:8080
```

---

## 6. Triển Khai Lên Firebase (Firebase Deployment)

Dự án đã có sẵn các tệp cấu hình chuẩn:
- `firebase.json`: Định tuyến Firebase Hosting tới thư mục `frontend` và trỏ quy tắc cơ sở dữ liệu `database.rules.json`.
- `.firebaserc`: Định danh dự án Firebase mặc định (`nasasspherex`).
- `database.rules.json`: Cấu hình mở quyền đọc cho cộng đồng khoa học công dân và ghi cho backend.

### Lệnh triển khai nhanh:
```bash
# Triển khai toàn bộ (Hosting + Database Rules):
firebase deploy

# Hoặc chỉ cập nhật giao diện web:
firebase deploy --only hosting
```

---

## 7. Hướng Dẫn Thao Tác Trực Quan Cho Người Dùng Phổ Thông

| Thao tác | Phím tắt / Hành vi | Kết quả hiển thị |
|---|---|---|
| **Phát / Tạm dừng nhấp nháy** | Nút to **`▶ Phát Chuyển Động`** hoặc phím `Spacebar` | Hình ảnh luân phiên qua lại giữa 3 thời kỳ (2025.0 ⇄ 2025.5 ⇄ 2026.0) để mắt dễ phát hiện chuyển động |
| **Chọn từng Thời kỳ** | Nút **`Năm 2025.0`**, **`Năm 2025.5`**, **`Năm 2026.0`** | Xem tĩnh từng ảnh chụp cách nhau 6 tháng |
| **Đổi Chế độ Nhận diện** | • **Ảnh Thường**<br>• **Tô Màu Đỏ/Xanh**<br>• **Chỉ Hiện Vật Thể Bay** | • Xem sao nền vũ trụ tự nhiên<br>• Thời kỳ 1 màu đỏ, thời kỳ 2 màu xanh — vật thể bay tách cặp đỏ-xanh<br>• Xóa sao nền tĩnh, chỉ hiện đốm của vật thể chuyển động |
| **Thu phóng & Kéo vùng trời** | Cuộn chuột (`Wheel`) & Kéo chuột trái | Phóng to từ 0.6× đến 5.0×; di chuyển camera tự do |
| **Căn giữa khung ngắm** | Nút **`Căn Giữa`** | Đưa khung nhìn về vị trí trung tâm chuẩn |
| **Chọn Thiên thể Khám phá** | Nhấp chuột vào thẻ bên phải hoặc nhấp thẳng vào đốm sáng trên bầu trời | Khóa vòng tròn tiêu điểm, hiển thị tên, phân loại, giải thích dễ hiểu và đồ thị phổ hồng ngoại |
| **Xem Vệt Vệ Tinh NEOSSat** | Nút **`🔍 Xem Vệt Quang Học Vệ Tinh CSA NEOSSat`** | Mở hộp thoại xem 7 khung ảnh quang học liên tiếp xác thực tiểu hành tinh |
| **Xem Hướng Dẫn Nhanh** | Nút **`Hướng Dẫn`** trên thanh Header | Bật hộp thoại giải thích 3 bước đơn giản cho người mới bắt đầu |
