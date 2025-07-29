 b# Trip Sync Project Requirement

---

## Tên đề tài

Xây dựng ứng dụng web và Điện thoại di động để quản lý chuyến công tác ngoài cơ quan

## Lý Thuyết

- Tìm hiểu các yêu cầu của công tác và quy trình thực hiện
- Tìm hiểu Framework React Native hoặc Flutter trên điện thoại di động
- Tìm hiểu ReactJS, Node.js, Express.js, MySQL, Google Cloud Storage (lưu file ảnh)
- Tìm hiểu thư viện bản đồ nguồn mở Leaflet.js và OpenStreetMap

## Thực Hành

### Xây dựng ứng dụng di động (cho nhân viên):
- Đăng nhập/Đăng xuất bằng tài khoản đã được cấp.
- Đăng ký công tác: Gửi đề xuất công tác (mục đích, mục tiêu, thời gian, địa điểm, lịch làm việc).
- Check-in/Check-out: Chấm công khi đến và rời khỏi khu vực công tác. Theo dõi lộ trình di chuyển: Hệ thống ghi nhận vị trí GPS theo thời gian thực.
- Báo cáo nội dung công tác: mục tiêu đã đạt (kèm minh chứng), đang thực hiện, đề xuất hủy (kèm lý do và minh chứng). Minh chứng: Chụp ảnh, quay video và tải lên kèm theo vị trí, thời gian cụ thể. Hỗ trợ gửi báo cáo tự động với các minh chứng.
- Nhận công tác/thông báo: Nhận các thông báo (công tác mới/phê duyệt/chỉ thị).
- Xem lịch sử công tác: Xem lại các chuyến công tác đã được duyệt và trạng thái.

### Xây dựng ứng dụng web (cho người quản lý):
- Quản lý người dùng: cấp tài khoản và phân quyền.
- Phân công công tác: tạo công tác giao cho nhân viên (có kế hoạch, mục đích, mục tiêu, thời điểm bắt đầu, thời hạn, vị trí công tác, lịch làm việc)
- Phê duyệt công tác: Duyệt/từ chối đề xuất (cho phép duyệt tự động), và thông báo cho nhân viên.
- Giám sát công tác: Xem vị trí của nhân viên đi công tác trên bản đồ (OpenStreetMap), xem chi tiết báo cáo công tác, bao gồm ảnh, video, vị trí.
- Tổng hợp dữ liệu: Lọc và xuất báo cáo (CSV/Excel) về các chuyến công tác theo thời gian.