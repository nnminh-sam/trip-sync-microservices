# Trip Sync Project Requirement

---

## Official Project Name

"Xây dựng hệ thống quản lý chuyến công tác theo kiến trúc microservices có giám sát và xác thực"

## Lý Thuyết

- Tìm hiểu quy trình quản lý công tác ngoài cơ quan và các yêu cầu nghiệp vụ.
- Tìm hiểu React Native/Flutter (ứng dụng di động) và ReactJS (ứng dụng web).
- Tìm hiểu Node.js, Express.js, MySQL trong kiến trúc microservices.
- Tìm hiểu Leaflet.js, OpenStreetMap để hiển thị bản đồ và lộ trình di chuyển.
- Tìm hiểu WebSocket/Firebase để giám sát GPS thời gian thực và gửi cảnh báo khi đi lệch lộ trình.
- Tìm hiểu cơ chế GnuPG để xác thực tính toàn vẹn của minh chứng (ảnh, video).
- Tìm hiểu kỹ thuật watermarking để nhúng thông tin thời gian + GPS vào ảnh/video.
- Tìm hiểu triển khai microservices trên Docker/Kubernetes.

## Thực Hành

### Phát triển hệ thống theo kiến trúc microservices:

- Dịch vụ quản lý người dùng.
- Dịch vụ quản lý công tác.
- GPS/Tracking Service.
- Dịch vụ lưu trữ minh chứng (dùng Google Cloud Storage hoặc MinIO).
- Dịch vụ xác thực GnuPG và watermark.

### Thiết kế và xây dựng ứng dụng cho hệ thống:

**Ứng dụng di động (cho nhân viên):**

- Đăng nhập bằng tài khoản được cấp (kèm Public Key)
- Đề xuất công tác (mục tiêu, thời gian, địa điểm, lịch làm việc)
- Nhận thông báo công tác mới, xem lịch sử công tác và trạng thái.
- Check-in/Check-out tại địa điểm công tác.
- Theo dõi GPS thời gian thực, cảnh báo khi ra ngoài phạm vi công tác
- Báo cáo và trao đổi nội dung công tác, kèm minh chứng (ảnh có watermark thời gian + tọa độ GPS, xác thực bằng GnuPG).

**Ứng dụng web (cho người quản lý):**

- Cấp tài khoản cho nhân viên của họ
- Định nghĩa công tác mới (mục tiêu, thời gian, địa điểm, lịch làm việc)
- Phân công công tác, phê duyệt đề xuất công tác
- Giám sát vị trí nhân viên trên bản đồ theo thời gian thực.
- Xem báo cáo công tác với minh chứng được xác thực, ra chỉ thị hướng dẫn
- Xem lịch sử công tác và trạng thái, thống kê theo tháng, năm