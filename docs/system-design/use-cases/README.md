# Trip Sync System Use Case Diagram

---

---

## Use Case Table

### Use Cases For All User In The System

All user here is the employee, manager, or higher level.

|  ID  | Name         | Description                                                         |
|:----:|:-------------|:--------------------------------------------------------------------|
| UC01 | Đăng nhập    | Nhân viên đăng nhập với hệ thống thông qua tài khoản được cấp       |
| UC01 | Đăng xuất    | Nhân viên đăng xuất ra khỏi hệ thống sau khi ở trạng thái đăng nhập |
| UC01 | Lưu địa điểm | Nhân viên đăng xuất ra khỏi hệ thống sau khi ở trạng thái đăng nhập |

### Use Cases With Employee as The Main Actor

|  ID  | Name                               | Description                                                                                                                                                                                                                     |
|:----:|:-----------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| UC01 | Đăng nhập                          | Nhân viên đăng nhập với hệ thống thông qua tài khoản được cấp                                                                                                                                                                   |
| UC01 | Đăng xuất                          | Nhân viên đăng xuất ra khỏi hệ thống sau khi ở trạng thái đăng nhập                                                                                                                                                             |
| UC02 | Đề xuất chuyến công tác            | Nhân viên đề xuất chuyến công tác mới với đầy đủ các thông tin cần thiét                                                                                                                                                        |
| UC03 | Xem danh sách chuyến công tác      | Nhân viên xem được danh sách những chuyến công tác đã thực hiện và chưa thực hiện                                                                                                                                               |
| UC03 | Xem chi tiết chuyến công tác       | Nhân viên xem thông tin chi tiết chuyến công tác, bao gồm địa điểm công tác, nhiệm vụ, tiến trình, các minh chứng đi kèm và yêu cầu liên quan                                                                                   |
| UC04 | Nhận thông báo công tác            | Nhân viên được nhận thông báo từ firebase hoặc hệ thống về sự kiện, hoạt động, hoặc tiến trình có liên quan đến chuyến công tác như phân công công tác, bắt đầu công tác, check-in/check-out, yêu cầu hủy, và kết thúc công tác |
| UC05 | Gửi minh chứng                     | Nhân viên thực hiện chụp hoặc tải ảnh lên ứng dụng, để ứng dụng ghi nhận vị trí GPS và thời gian gửi minh chứng và thực hiện lưu trữ minh chứng                                                                                 |
| UC05 | Check In/Out tại địa điểm công tác | Nhân viên thực hiện quá trình check-in/check-out tại địa điểm công tác                                                                                                                                                          |
| UC07 | Gửi yêu cầu hủy chuyến công tác    | Nhân viên thực hiện gửi yêu cầu hủy công tác                                                                                                                                                                                    |
| UC07 | Gửi yêu cầu hủy nhiệm vụ công tác  | Nhân viên thực hiện gửi yêu cầu hủy nhiệm vụ công tác                                                                                                                                                                           |

### Use Cases With Manager as The Main Actor

|  ID  | Name                       | Description                                                                               |
|:----:|:---------------------------|:------------------------------------------------------------------------------------------|
| UC10 | Provision Employee Account | Create and manage employee accounts with provisioned public keys                          |
| UC11 | Define Business Trip       | Create and define new business trips with objective, time, destination, and work schedule |
| UC12 | Assign Trip to Employee    | Assign defined business trips to specific employees                                       |
| UC13 | Approve Trip Proposal      | Review and approve business trip proposals submitted by employees                         |
| UC14 | Monitor Employee Location  | Monitor employee locations on the map in real-time during business trips                  |
| UC15 | View Trip Reports          | View trip reports with verified evidence from employees                                   |
| UC16 | Issue Directives           | Provide directives and guidance based on trip reports and evidence                        |
| UC17 | Generate Statistics        | Generate statistics and analytics by month and year                                       |

### Use Cases With System as The Main Actor

|  ID  | Name                   | Description                                                    |
|:----:|:-----------------------|:---------------------------------------------------------------|
| UC06 | Real-time GPS Tracking | Enable and monitor real-time GPS tracking during business trip |