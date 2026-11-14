# Sổ Tay Vận Hành Dự Án: SPHEREx ChronoSpectra
**Tệp định danh:** `OPERATIONS_MANUAL.md`  
**Dự án:** NASA SPHEREx Citizen Science Platform — Multi-Mission Transient Explorer  
**Phiên bản:** v2.4-Production

---

## 1. Yêu Cầu Môi Trường (System Prerequisites)

| Thành phần | Yêu cầu tối thiểu | Khuyến nghị | Ghi chú |
|---|---|---|---|
| **Hệ điều hành** | Windows 10/11, macOS 12+, Ubuntu 20.04+ | Windows 11 / Linux | Đã kiểm thử tương thích đa nền tảng |
| **Python** | Python 3.10+ | Python 3.11 hoặc 3.14 | Cần thiết để chạy backend xử lý dữ liệu thiên văn |
| **Trình quản lý gói** | `pip` tiêu chuẩn | `uv` (Astral) | `uv` giúp cài đặt thư viện và chạy script cực nhanh (dưới 1 giây) |
| **Trình duyệt Web** | Chrome 100+, Edge 100+, Firefox 90+, Safari 15+ | Google Chrome / Microsoft Edge | Hỗ trợ chuẩn HTML5 Canvas 2D & WebGL |

---

## 2. Cài Đặt Môi Trường (Installation)

### Cách 1: Sử dụng `uv` (Khuyên dùng — Nhanh nhất & Tự động)
Nếu máy đã cài `uv`, bạn không cần thiết lập môi trường ảo thủ công:
```bash
# Kiểm tra uv đã sẵn sàng
uv --version
```
Mỗi tệp Python trong `backend/` đã được nhúng siêu dữ liệu phụ thuộc (PEP 723). Khi bạn gọi `uv run`, các thư viện cần thiết sẽ được nạp tức thì trong môi trường cách ly tạm thời.

### Cách 2: Sử dụng `pip` và `venv` truyền thống
```bash
# 1. Tạo môi trường ảo Python
python -m venv .venv

# 2. Kích hoạt môi trường ảo
# Trên Windows PowerShell:
.venv\Scripts\Activate.ps1
# Trên macOS/Linux:
source .venv/bin/activate

# 3. Cài đặt toàn bộ thư viện cần thiết
pip install -r requirements.txt
```

---

## 3. Kiểm Thử Hệ Thống (Automated Testing)

Trước khi khởi động hệ thống cho buổi báo cáo hoặc sử dụng thực tế, hãy chạy bộ kiểm thử đơn vị tự động để xác nhận toàn bộ các thuật toán hoạt động chính xác:

```bash
# Chạy toàn bộ test suite bằng uv
uv run --with "pytest" --with "astropy" --with "numpy" --with "scipy" --with "pillow" --with "pydantic" pytest backend/tests/test_pipeline.py -v
```

Hoặc nếu đang kích hoạt môi trường ảo `venv`:
```bash
pytest backend/tests/test_pipeline.py -v
```

> **Kết quả kỳ vọng**: `4 passed in < 1.5s`  
> - `test_wavelength_conversions`: Kiểm tra ánh xạ 102 dải phổ ($0.75 - 5.0\,\mu\text{m}$).  
> - `test_gaia_space_motion_propagation`: Kiểm tra độ chính xác lan truyền vị trí sao Gaia DR3 qua 9 năm.  
> - `test_background_estimation`: Kiểm tra thuật toán khử nền $2\text{D}$ sigma-clipping.  
> - `test_difference_imaging`: Kiểm tra độ triệt tiêu nền khi trừ 2 ảnh đồng nhất.

---

## 4. Vận Hành Backend (REST API Service)

### 4.1 Khởi động Máy Chủ REST API (Uvicorn / FastAPI)
Để cung cấp dữ liệu cho giao diện Web, khởi động dịch vụ backend:
```bash
uv run backend/run_server.py --serve --port 8000
```
- **Địa chỉ API chính**: `http://127.0.0.1:8000`
- **Tài liệu Swagger tương tác (API Docs)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Kiểm tra trạng thái máy chủ (Health Check)**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 4.2 Chạy Kiểm Tra Nhanh Qua Dòng Lệnh (CLI Mode)
Bạn có thể phân tích bất kỳ tọa độ thiên văn nào trực tiếp trên terminal mà không cần mở trình duyệt:
```bash
uv run backend/run_server.py --ra 90.0 --dec -66.56 --radius 30.0
```
Terminal sẽ in ra toàn bộ kết quả phân tích:
- Loại thiên thể suy luận (Brown Dwarf, Asteroid, Comet, Star).
- Độ sâu vạch hấp thụ $CH_4$, đỉnh phát xạ $CO_2$, độ dốc nhiệt.
- Danh sách sao Gaia DR3 khớp tọa độ và độ dịch chuyển tương đối.
- Dữ liệu vệt quang học CSA NEOSSat.

---

## 5. Vận Hành Frontend (Giao Diện Web ChronoSpectra)

### 5.1 Khởi chạy giao diện
- **Phiên bản chuẩn phân lớp (Modular ES)**: Mở trực tiếp file [`frontend/index.html`](frontend/index.html) bằng trình duyệt hoặc qua Live Server.
- **Phiên bản chạy offline một file duy nhất**: Mở [`frontend/standalone/spherex-chronospectra-singlefile.html`](frontend/standalone/spherex-chronospectra-singlefile.html).

### 5.2 Hướng Dẫn Thao Tác & Phím Tắt

| Thao tác | Phím tắt / Hành vi chuột | Mô tả chức năng |
|---|---|---|
| **Bật/Tắt Blinking** | Phím `Space` hoặc nút `[▶ / ❚❚]` | Tự động chuyển đổi chu kỳ giữa Epoch 1 ($2025.0$), Epoch 2 ($2025.5$) và Epoch 3 ($2026.0$). |
| **Chuyển Epoch thủ công** | Phím mũi tên `←` / `→` | Bước lùi hoặc bước tiến từng ảnh 6 tháng để kiểm tra dịch chuyển tọa độ. |
| **Điều chỉnh tần số nhấp nháy** | Thanh trượt `BLINK: 1 - 10 Hz` | Tăng giảm tốc độ đổi ảnh từ $1.0\,\text{Hz}$ đến $10.0\,\text{Hz}$. |
| **Phóng to / Thu nhỏ** | Cuộn chuột (`Scroll Wheel`) | Zoom từ $0.6\times$ đến $6.0\times$ để soi chi tiết từng pixel. |
| **Di chuyển khung nhìn (Pan)** | Giữ chuột trái và kéo | Di chuyển khắp vùng trời quan sát $45^\prime \times 45^\prime$. |
| **Căn giữa lại khung hình** | Nút `[Reset FOV]` ở thanh trên | Đưa vùng trời về vị trí trung tâm mặc định. |
| **Chuyển chế độ hiển thị** | Hàng nút chế độ `[Composite / Dipole / Diff / Invert]` | - `Composite`: Ảnh tự nhiên NIR.<br/>- `Red/Cyan Dipole`: Epoch 1 đỏ, Epoch 2 xanh lơ. Sao đứng yên biến thành trắng, thiên thể di chuyển tách thành cặp đôi.<br/>- `Difference`: Trừ khử nền sao, chỉ hiện phần dư chuyển động.<br/>- `Invert`: Âm bản chụp ảnh thiên văn truyền thống. |
| **Khử sao quang học Gaia** | Nút `[Mask Known Gaia Stars]` | Làm mờ $88\%$ độ sáng của các sao đã biết trong Gaia DR3, làm lộ diện thiên thể ẩn. |
| **Quét dải bước sóng 102 Band**| Thanh trượt `BAND: 0 - 102` | Quét dải bước sóng từ $0.75\,\mu\text{m}$ đến $5.0\,\mu\text{m}$ kèm các nút chọn nhanh phân tử. |
| **Xem chi tiết thiên thể** | Nhấp chuột trái vào thiên thể | Hiển thị thông số đo quang, vẽ phổ 102 band và bảng phân tích phân tử ở chân trang. |
| **Kiểm tra vệt quang học CSA** | Nút `[Inspect CSA NEOSSat Optical Strip]` | Mở drawer hiển thị 3 frame chụp quang học liên tiếp của kính viễn vọng không gian Canada. |
| **Bình chọn phân loại** | Các nút trong `Citizen Science Voting` | Ghi nhận ý kiến công dân khoa học (Brown Dwarf, Asteroid, Comet, Known Star). |
| **Xuất dữ liệu khoa học** | Nút `[Export VO-Table JSON]` | Tải về máy tệp JSON chứa toàn bộ dữ liệu đo quang và trắc tinh để lập báo cáo. |

---

## 6. Hướng Dẫn Tích Hợp API (Dành Cho Nhà Phát Triển)

### Gọi API kiểm tra vùng trời qua cURL:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/inspect-sky-sector" \
     -H "Content-Type: application/json" \
     -d '{
       "ra": 90.0,
       "dec": -66.5606,
       "radius_arcsec": 30.0,
       "epoch1_date": "2025-01-01",
       "epoch2_date": "2025-07-01",
       "cutout_size_pix": 64
     }'
```

### Gọi API kiểm tra qua Python `requests`:
```python
import requests

payload = {
    "ra": 90.0625,
    "dec": -66.5700,
    "radius_arcsec": 30.0,
    "epoch1_date": "2025-01-01",
    "epoch2_date": "2025-07-01",
    "cutout_size_pix": 64
}

response = requests.post("http://127.0.0.1:8000/api/v1/inspect-sky-sector", json=payload)
data = response.json()

print(f"Lớp thiên thể nhận diện: {data['spectral_profile']['inferred_class']}")
print(f"Độ sâu vạch CH4: {data['spectral_profile']['ch4_trough_depth']}")
print(f"Số lượng sao Gaia khớp: {len(data['gaia_dr3_crossmatch'])}")
```

---

## 7. Khắc Phục Sự Cố Thường Gặp (Troubleshooting & FAQs)

### 1. Không kết nối được internet trong buổi thuyết trình hackathon:
- **Giải pháp**: Hệ thống đã được tích hợp bộ ngắt mạch tự động (**Circuit Breaker**). Khi dịch vụ từ xa (IRSA, Gaia ESAC, CADC) không phản hồi trong $2.5\,\text{giây}$, hệ thống tự động kích hoạt bộ giả lập đa dải băng chuẩn hóa mà không làm treo ứng dụng hay báo lỗi.

### 2. Trình duyệt không tải được module JavaScript:
- **Hiện tượng**: Lỗi `Access to script at ... from origin 'null' has been blocked by CORS policy` khi nhấp đúp trực tiếp vào `frontend/index.html`.
- **Giải pháp**:
  - Khởi chạy một local HTTP server cực nhẹ:
    ```bash
    # Chạy từ thư mục gốc dự án:
    python -m http.server 3000
    ```
    Sau đó truy cập: `http://localhost:3000/frontend/`
  - Hoặc mở bản một file duy nhất: [`frontend/standalone/spherex-chronospectra-singlefile.html`](frontend/standalone/spherex-chronospectra-singlefile.html) (chạy được trên mọi trình duyệt mà không cần web server).

### 3. Cổng 8000 bị xung đột khi chạy Backend:
- **Giải pháp**: Chỉ định cổng khác bằng tham số `--port`:
  ```bash
  uv run backend/run_server.py --serve --port 8080
  ```
  Sau đó cập nhật giá trị `API_BASE_URL` trong file `frontend/js/config.js` thành `http://127.0.0.1:8080/api/v1`.

