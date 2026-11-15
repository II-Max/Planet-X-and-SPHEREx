#!/usr/bin/env python3
"""
run_backend.py
──────────────
Bộ điều khiển trung tâm hệ thống Backend SPHEREx:
- TÍNH NĂNG 1: Tải dữ liệu thiên văn (SPHEREx 102 bands, Gaia DR3, NEOSSat).
- TÍNH NĂNG 2: Đẩy dữ liệu lên Firebase Realtime Database.

Cách dùng đơn giản:
  python run_backend.py                      # Chạy cả 2 tính năng (Tải về và Đẩy lên Firebase)
  python run_backend.py --download           # Chỉ tải dữ liệu và xử lý (lưu cache)
  python run_backend.py --push               # Chỉ đẩy dữ liệu đã xử lý lên Firebase RTDB
  python run_backend.py --download-and-push  # Tải dữ liệu và đẩy lên Firebase
"""

import sys
from pathlib import Path

# Thêm đường dẫn thư mục hiện tại
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.firebase_sync import main

if __name__ == "__main__":
    main()
