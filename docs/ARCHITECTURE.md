# SPHEREx ChronoSpectra — Kiến Trúc Hệ Thống & Cấu Trúc Dự Án (Firebase Edition)

## 1. Sơ Đồ Kiến Trúc 2 Phân Hệ (System Architecture)

```mermaid
flowchart TD
    subgraph EXTERNAL["Dữ Liệu Thiên Văn Vũ Trụ (Multi-Mission Archives)"]
        IRSA["NASA / IPAC IRSA<br/>SPHEREx SIAv2 / TAP<br/>(102-Band NIR Cubes)"]
        GAIA["ESA / ESAC Gaia DR3<br/>ADQL cone search<br/>(Astrometry & Space Motion)"]
        CADC["CSA / CADC NEOSSat<br/>CAOM2 TAP service<br/>(Optical Streak Tracking)"]
    end

    subgraph BACKEND["Phân Hệ 1: Backend Python (Xử Lý & Đồng Bộ Firebase)"]
        subgraph INGESTION["Tầng Thu Thập & Chuẩn Hóa (Ingestion Layer)"]
            MOD_IRSA["irsa_service.py<br/>WCS Cutout2D"]
            MOD_GAIA["gaia_service.py<br/>apply_space_motion()"]
            MOD_CADC["cadc_neossat.py<br/>NEOSSat Tracking"]
            MOD_SYN["synthetic_generator.py<br/>Offline 102-band Cube Fallback"]
        end

        subgraph PIPELINE["Tầng Thuật Toán & Xử Lý Ảnh (Pipeline Layer)"]
            MOD_BG["background.py<br/>Sigma-Clipped Background"]
            MOD_DIFF["difference.py<br/>PSF Matched Diff: ΔI = I₂ - α·I₁"]
            MOD_DIPOLE["dipole_detector.py<br/>Extrema Pairing & SNR"]
            MOD_SPEC["spectral_classifier.py<br/>CH₄, CO₂, Thermal Slopes"]
        end

        subgraph SYNC_LAYER["Tầng Đồng Bộ Firebase (Sync Layer)"]
            MOD_FSYNC["firebase_sync.py<br/>1. Download & Process<br/>2. Push to Firebase RTDB"]
            RUN_CLI["run_backend.py<br/>CLI Launcher (Tải & Đẩy)"]
        end
    end

    subgraph CLOUD["Nền Tảng Đám Mây Firebase (Cloud Infrastructure)"]
        RTDB["Firebase Realtime Database<br/>/spherex (JSON Tree)<br/>https://aboutme-iimax-default-rtdb..."]
        HOSTING["Firebase Hosting<br/>Global CDN Web App<br/>https://aboutme-iimax.web.app"]
    end

    subgraph FRONTEND["Phân Hệ 2: Frontend Khám Phá (Dark Mode Gray - Tinh Giản)"]
        CORE_RENDER["SkyRenderer<br/>Canvas 2D (Composite, Dipole, Diff)"]
        CORE_CTRL["1-Touch Blinker<br/>Năm 2025.0 ⇄ 2025.5 ⇄ 2026.0"]
        SPEC_CHART["Phổ Hồng Ngoại Tinh Giản<br/>Hấp thụ CH₄ & Phát xạ CO₂"]
        INSPECTOR["Thẻ Khám Phá & Diễn Giải<br/>Dành cho Người Dùng Phổ Thông"]
        FB_LISTENER["Firebase Sync Listener<br/>db.ref('spherex').on('value')"]
    end

    IRSA --> MOD_IRSA
    GAIA --> MOD_GAIA
    CADC --> MOD_CADC
    MOD_SYN -.->|Fallback khi offline| MOD_IRSA

    MOD_IRSA --> MOD_BG
    MOD_BG --> MOD_DIFF
    MOD_DIFF --> MOD_DIPOLE
    MOD_IRSA --> MOD_SPEC

    MOD_DIPOLE --> MOD_FSYNC
    MOD_SPEC --> MOD_FSYNC
    MOD_GAIA --> MOD_FSYNC
    MOD_CADC --> MOD_FSYNC
    RUN_CLI --> MOD_FSYNC

    MOD_FSYNC ==HTTP PUT==> RTDB
    HOSTING -.->|Cung cấp tệp tĩnh| FRONTEND
    RTDB ==WebSocket / EventStream==> FB_LISTENER
    FB_LISTENER --> CORE_RENDER
    FB_LISTENER --> INSPECTOR
    FB_LISTENER --> SPEC_CHART
    CORE_CTRL --> CORE_RENDER
```

---

## 2. Cấu Trúc Thư Mục Khoa Học & Phân Tách Trách Nhiệm (Directory Structure)

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

## 3. Bảng Phân Tách Nhiệm Vụ Từng Module (Responsibility Matrix)

| Module / Tệp tin | Trách nhiệm chính (Single Responsibility) | Giao thức / Công nghệ |
|---|---|---|
| `run_backend.py` | Điểm điều khiển trung tâm: Tải dữ liệu thiên văn và đẩy lên Firebase | Python CLI |
| `backend/firebase_sync.py` | Thực thi Tính năng 1 (Xử lý trắc quang đa epoch) & Tính năng 2 (HTTP PUT lên Firebase) | Requests / Firebase Admin / Astropy |
| `backend/ingestion/gaia_service.py` | Lan truyền không gian 3D sao Gaia (`apply_space_motion`) qua 9 năm | Astropy Coordinates & Time |
| `backend/ingestion/cadc_neossat.py` | Truy vấn vệt quỹ đạo vệ tinh Canada NEOSSat | CAOM2 TAP / CADC |
| `backend/pipeline/difference.py` | Cân bằng mức nền PSF và trừ 2 epoch: $\Delta I = I_2 - \alpha \cdot I_1$ | NumPy / SciPy Filters |
| `backend/pipeline/dipole_detector.py` | Bắt cặp cực đại/cực tiểu dipole, tính vector chuyển động và SNR | SciPy ndimage |
| `backend/pipeline/spectral_classifier.py` | Phân loại phổ 102 băng qua hố hấp thụ $CH_4$, đỉnh $CO_2$, bức xạ nhiệt | NumPy SED analysis |
| `frontend/index.html` | Cấu trúc giao diện HTML5 tinh giản phong cách Dark Mode Design - Gray | HTML5 Semantic |
| `frontend/js/app.js` | Quản lý vẽ canvas, nhấp nháy chuyển động 1-chạm, lắng nghe Firebase thời gian thực | Canvas 2D API / Firebase JS SDK |
| `database.rules.json` | Quy tắc bảo mật Realtime Database: Mở đọc công cộng, cho phép backend ghi | Firebase Security Rules |
| `firebase.json` | Cấu hình Hosting định tuyến tới `frontend` và trỏ database rules | Firebase CLI Config |

---

## 4. Địa Chỉ Trực Tuyến & Kiểm Thử

- 🌐 **Website trải nghiệm trực tiếp (Firebase Hosting)**:  
  **[https://aboutme-iimax.web.app](https://aboutme-iimax.web.app)**
- 📡 **Firebase Realtime Database Endpoint**:  
  **`https://aboutme-iimax-default-rtdb.asia-southeast1.firebasedatabase.app`**
- 🧪 **Kiểm thử tự động**:
  ```bash
  pytest backend/tests/test_pipeline.py -v
  ```
  *(4/4 bài test vượt qua trong < 1.0 giây)*
