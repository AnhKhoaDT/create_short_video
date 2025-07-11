
---

## ⚙️ Hướng dẫn cài đặt

### 1️⃣ Backend (Spring Boot)

```bash
cd conect-database/conect-database
./mvnw clean install
./mvnw spring-boot:run
```

- Cấu hình file `src/main/resources/application.properties`:
    - Thông tin kết nối MySQL
    - Cloudinary API Key/Secret
    - FPT.AI API Key

### 2️⃣ Frontend (HTML/JS)

- Không cần build, chỉ cần mở file `frontend/homepage.html` trên trình duyệt (hoặc deploy lên web server tĩnh như nginx, Apache, hoặc Spring Boot static resource).

---

## 🖼️ Hướng dẫn sử dụng

1. Truy cập `http://localhost:8080/create-video-service/homepage.html`.
2. Đăng nhập hoặc đăng ký tài khoản.
3. Tạo kịch bản video mới.
4. Chỉnh sửa kịch bản, chọn giọng đọc, nghe thử.
5. Nhấn **"Tiếp tục"** để tạo audio cho từng scene.
6. Chọn hoặc tạo ảnh nền cho từng scene.
7. Xem trước video, tải về hoặc quản lý video/ảnh/kịch bản.

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp!

- **Fork** repo.
- Tạo branch mới:  
    `git checkout -b feature/ten-tinh-nang`
- Commit & gửi pull request.

---

## 📝 License

Dự án phát hành theo giấy phép **MIT** – xem chi tiết tại file LICENSE.

---

## 🙏 Lời cảm ơn

Cảm ơn cộng đồng mã nguồn mở và các dịch vụ AI (FPT.AI, Cloudinary, ...), các thư viện Java, TailwindCSS đã hỗ trợ dự án này!
