# SPHEREx Explorer — Multi-Epoch Sky & Spectral Explorer
### Nền tảng Khoa học Công dân Khám phá Thiên thể Chuyển động Đa Bước sóng (NASA SPHEREx / ESA Gaia DR3 / CSA NEOSSat)

---

### 🌐 TRẢI NGHIỆM TRỰC TUYẾN NGAY TẠI ĐÂY:
> 👉 **Website chính thức (Firebase Hosting):** **[https://aboutme-iimax.web.app](https://aboutme-iimax.web.app)**  
> 📡 **Firebase Realtime Database Endpoint:** **`https://aboutme-iimax-default-rtdb.asia-southeast1.firebasedatabase.app`**

[![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Live_Website-f5820d.svg?style=for-the-badge&logo=firebase)](https://aboutme-iimax.web.app)
[![Firebase RTDB](https://img.shields.io/badge/Firebase_RTDB-Realtime_Sync-ffca28.svg?style=for-the-badge&logo=firebase)](https://aboutme-iimax-default-rtdb.asia-southeast1.firebasedatabase.app)
[![NASA SPHEREx](https://img.shields.io/badge/NASA-SPHEREx_Mission-0b3d91.svg?style=for-the-badge&logo=nasa)](https://spherex.caltech.edu/)
[![ESA Gaia DR3](https://img.shields.io/badge/ESA-Gaia_DR3-2b2d42.svg?style=for-the-badge)](https://www.cosmos.esa.int/web/gaia/dr3)
[![CSA NEOSSat](https://img.shields.io/badge/CSA-NEOSSat_CADC-d90429.svg?style=for-the-badge)](https://www.asc-csa.gc.ca/eng/satellites/neossat/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?style=for-the-badge&logo=python)](https://www.python.org/)
[![Tests](https://img.shields.io/badge/Tests-4%2F4%20Passing-brightgreen.svg?style=for-the-badge)](#5-kiểm-thử-hệ-thống)

---

## 1. Giới Thiệu Dự Án & Định Hướng Người Dùng Phổ Thông

**SPHEREx Explorer** là nền tảng web mã nguồn mở phục vụ cộng đồng khoa học công dân (Citizen Science) trong khuôn khổ thử thách NASA Space Apps Hackathon. Dự án nâng cấp công cụ nhấp nháy đa thời kỳ kinh điển **WiseView** (dự án *Backyard Worlds*) kết hợp với khả năng quét toàn trời qua **102 dải phổ cận hồng ngoại ($0.75 - 5.0\,\mu\text{m}$)** của **NASA SPHEREx**, dữ liệu trắc tinh **ESA Gaia DR3**, và dải theo dõi quang học từ **CSA NEOSSat**.

### 🌟 Điểm Nhấn Thiết Kế Mới:
- **Phong cách Dark Mode Design – Gray**: Sử dụng tông màu xám than chì tối sâu sang trọng (`#0e1014`, `#14171d`, `#1b1f27`) với độ tương phản chuẩn mực, giúp quan sát lâu mà không bị mỏi mắt.
- **Tối giản & Trực quan 1-chạm**: Loại bỏ hoàn toàn các thanh trượt phức tạp và thuật ngữ khó hiểu. Người dùng phổ thông chỉ cần bấm nút **`▶ Phát Chuyển Động`** là có thể quan sát thấy ngay các thiên thể đang bay qua bầu trời.
- **Diễn giải khoa học thân thiện**: Giải thích rõ ràng bằng tiếng Việt: *"Đây là vật thể gì? Tại sao quan trọng? Tốc độ di chuyển bao nhiêu?"*.
- **Cam kết Không Bao Giờ Trắng Màn Hình (Zero-Failure Architecture)**: Khắc phục triệt để lỗi chặn CORS trên tệp cục bộ. Dù người dùng mở trực tiếp qua file máy tính hay truy cập mạng, hệ thống luôn sẵn sàng 100%.

---

## 2. Kiến Trúc 2 Phân Hệ Cốt Lõi

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
│         https://aboutme-iimax-default-rtdb.asia-southeast1...          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                          WebSocket / EventStream
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  PHÂN HỆ 2: FRONTEND (HTML / CSS / JS)                 │
│                                                                        │
│   • Triển khai trên Firebase Hosting: https://aboutme-iimax.web.app    │
│   • Phong cách Dark Mode Design - Gray tinh giản cho người phổ thông   │
│   • Lắng nghe realtime từ Firebase DB (db.ref('spherex').on('value')) │
│   • Không bao giờ bị màn hình trắng (cơ chế Zero-Failure Fallback)     │
│   • Bộ điều khiển 1-chạm: Phát chuyển động, Tô màu Đỏ/Xanh, Trừ nền   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Phân Hệ Backend (Python)** gồm 2 tính năng chính:
   - **Tính năng 1: Tải dữ liệu về & Xử lý**: Truy vấn hoặc giả lập khối phổ đa thời kỳ SPHEREx (Epoch 2025.0, 2025.5, 2026.0), tính toán lan truyền chuyển động riêng Gaia DR3 qua 9 năm, tích hợp vệt quỹ đạo NEOSSat; chạy thuật toán khử nền sigma-clipping, trừ ảnh dipole $E_2 - E_1$, trích xuất 102 băng phổ SED.
   - **Tính năng 2: Đẩy lên Realtime Database ở Firebase**: Tự động đóng gói và đẩy dữ liệu lên Firebase Realtime Database nhánh `/spherex` với độ trễ dưới 1 giây.
2. **Phân Hệ Frontend (HTML/JS trên Firebase)**:
   - Triển khai toàn cầu trên **Firebase Hosting**: [https://aboutme-iimax.web.app](https://aboutme-iimax.web.app).
   - Tự động cập nhật thời gian thực khi Backend đẩy dữ liệu mới mà không cần F5 tải lại trang.

---

## 3. Cấu Trúc Thư Mục Dự Án (Directory Structure)

```
c:\Users\Phamv\OneDrive\Desktop\Planet X and SPHEREx\
│
├── run_backend.py                       # [ĐIỀU KHIỂN CHÍNH] Chạy Tính năng 1 (Tải về) & Tính năng 2 (Đẩy Firebase)
├── firebase.json                        # Cấu hình Firebase Hosting & Realtime Database Rules
├── .firebaserc                          # Cấu hình dự án Firebase mặc định (aboutme-iimax)
├── database.rules.json                  # Quy tắc bảo mật Realtime Database
├── requirements.txt                     # Danh mục thư viện Python (astropy, firebase-admin, requests, etc.)
├── index.html                           # Cổng điều hướng chính cho root workspace
├── .gitignore                           # Quy tắc loại trừ tệp tạm, cache, logs
│
├── backend/                             # PHÂN HỆ 1: BACKEND XỬ LÝ & ĐỒNG BỘ
│   ├── firebase_sync.py                 # Module 2 tính năng: Tải dữ liệu thiên văn & Đẩy lên Firebase RTDB
│   ├── app.py                           # Ứng dụng REST API phụ trợ (FastAPI)
│   ├── run_server.py                    # Khởi chạy server FastAPI hoặc CLI kiểm tra
│   ├── config.py                        # Tham số vật lý, dải bước sóng, URL dịch vụ
│   ├── data/                            # Bộ nhớ đệm dữ liệu cục bộ (spherex_synced_data.json)
│   ├── ingestion/                       # Kết nối kho dữ liệu đa nhiệm vụ (IRSA, Gaia DR3, NEOSSat, Synthetic)
│   ├── pipeline/                        # Thuật toán thiên văn (background, difference, dipole, classifier, tiling)
│   └── tests/                           # Bộ kiểm thử tự động (test_pipeline.py)
│
├── frontend/                            # PHÂN HỆ 2: GIAO DIỆN WEB KHOA HỌC CÔNG DÂN (DARK MODE GRAY)
│   ├── index.html                       # Giao diện chính tinh giản, dễ hiểu cho người dùng phổ thông
│   ├── css/                             # Stylesheets phân lớp Dark Mode Gray
│   │   ├── variables.css                # Bảng màu xám than chì sang trọng, tokens
│   │   ├── layout.css                   # Grid layout 2 cột thoáng đãng (Canvas bên trái, Thẻ thông tin bên phải)
│   │   └── components.css               # Nút bấm 1-chạm, thẻ vật thể, hộp giải thích, biểu đồ phổ
│   └── js/
│       ├── app.js                       # Logic ứng dụng tinh giản: SkyRenderer, Spectrum, Blinker, Firebase Sync
│       ├── config.js                    # Hằng số thiên văn
│       ├── core/                        # Core classes phục vụ module mở rộng
│       ├── components/                  # UI components phục vụ phân lớp sâu
│       └── services/                    # ApiClient, MockDataService
│
├── docs/                                # Tài liệu kỹ thuật chuyên sâu
│   ├── ARCHITECTURE.md                  # Bản vẽ kiến trúc hệ thống toàn diện
│   └── GAIA_SPACE_MOTION_PROPAGATION.md # Đặc tả giải thuật lan truyền chuyển động sao Gaia DR3
│
└── OPERATIONS_MANUAL.md                 # Sổ tay vận hành, cài đặt và phím tắt chi tiết
```

---

## 4. Hướng Dẫn Vận Hành Nhanh (Quickstart Guide)

### Bước 1: Cài đặt thư viện Python
```bash
pip install -r requirements.txt
```

### Bước 2: Chạy Backend (Tải dữ liệu về & Đẩy lên Firebase RTDB)
Chỉ cần chạy một lệnh duy nhất:
```bash
python run_backend.py --download-and-push
```
- ✓ TÍNH NĂNG 1 HOÀN THÀNH: Tải và xử lý 350 sao nền, 4 ứng viên di chuyển, 102 băng phổ.
- ✓ TÍNH NĂNG 2 HOÀN THÀNH: Đẩy dữ liệu lên Firebase RTDB với trạng thái `HTTP 200 OK`.

### Bước 3: Trải Nghiệm Giao Diện
- **Cách 1 (Khuyên dùng - Trực tuyến)**: Truy cập ngay 👉 **[https://aboutme-iimax.web.app](https://aboutme-iimax.web.app)**
- **Cách 2 (Mở tệp cục bộ)**: Nhấp đúp mở [`index.html`](index.html) hoặc [`frontend/index.html`](frontend/index.html) bằng Chrome hoặc Edge.

---

## 5. Kiểm Thử Hệ Thống (Automated Testing)

Chạy bộ kiểm thử tự động để xác minh toàn bộ thuật toán thiên văn:
```bash
pytest backend/tests/test_pipeline.py -v
```
> Kết quả: `4 passed in 0.91s` (Kiểm thử lan truyền Gaia DR3, chuyển đổi 102 băng phổ, khử nền sigma-clipping, trừ ảnh dipole).

---

## 6. Bốn Thiên Thể Kiểm Chuẩn Mẫu (Discovery Benchmarks)

| Mã Thiên Thể | Phân Loại | Màu Sắc | Dấu Vết Đặc Trưng (Dễ Hiểu) | Tốc Độ & Trạng Thái |
|---|---|---|---|---|
| **`SPX-J0600`** | **Sao lùn nâu Y0** | 🟣 Tím | Ngôi sao siêu lạnh, vô hình trên kính quang học Gaia DR3, có rãnh khí **Mê-tan (CH₄)** sâu ở $3.3\,\mu\text{m}$ | $0.71^{\prime\prime}$ / 6 tháng (~420 K) |
| **`NEO-2025`** | **Tiểu hành tinh Apollo** | 🟡 Vàng | Đá vũ trụ bay nhanh gần Trái Đất, bức xạ nhiệt mạnh $>4.0\,\mu\text{m}$, có vệt kiểm chứng từ **vệ tinh NEOSSat** | $18.4^{\prime\prime}$ / giờ (~295 K) |
| **`C/2025-S1`** | **Sao chổi Oort** | 🟢 Xanh lá | Khối băng từ rìa Hệ Mặt Trời, tỏa quầng khí mờ với đỉnh phát xạ khí **Carbonic (CO₂)** ở $4.26\,\mu\text{m}$ | $2.05^{\prime\prime}$ / 6 tháng (~180 K) |
| **`TNO-2025`** | **Thiên thể Kuiper (TNO)** | 🔵 Xanh cyan | Thiên thể băng giá ở rìa xa ngoài Hải Vương Tinh ($r > 42\,\text{AU}$), di chuyển cực kỳ chậm | $0.34^{\prime\prime}$ / 6 tháng (~45 K) |

---

## 7. Triển Khai Lên Firebase Hosting (Deployment)
Khi bạn thực hiện chỉnh sửa giao diện hoặc quy tắc dữ liệu, chỉ cần chạy:
```bash
firebase deploy
```

---

## 8. Giấy Phép & Lời Cảm Ơn (License & Acknowledgements)
- Dự án phát hành theo giấy phép **MIT License**.
- Trân trọng cảm ơn **NASA/IPAC IRSA**, **ESA Gaia DR3 Team**, **CSA/CADC NEOSSat Team**, và cộng đồng **WiseView / Backyard Worlds: Planet 9**.
