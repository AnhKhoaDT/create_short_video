1. Sử dụng trang web spring để tạo dự án
2. Kết nối database và tải các dependency
- sử dụng interface UserRepository để tương tác với CSDL
- UserRepository-> Service-> Controller( gọi api)
3. Quản lý lỗi exception và trả về các api chuẩn
4. Lombok và mapstruct để tinh giản code
5. Với các anotition phổ biến
- @Value dùng để lấy giá trị trong file lên
- @Data cung cấp các getter setter ...
- 
6. Mã hóa mật khẩu
7. Tạo kí xác thực jwt
8. Kiến trúc spring security
- Client-> Filter -> Filter Chain Proxy -> Filter -> Servlet -> (R-S-C)
- Filter, Filter Chain Proxy thì có thể cho đi tiếp hoặc trả về cho client lun
9. Phân quyền theo cách enpoint qua role 
10. Phân quyền theo các method ( cái này phổ biến trong thực tế hơn)
