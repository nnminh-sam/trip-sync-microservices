# Phân tích và Thiết kế Hệ Thống

---

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Phân tích và Thiết kế Hệ Thống](#phân-tích-và-thiết-kế-hệ-thống)
  - [Phân tích hệ thống](#phân-tích-hệ-thống)
    - [Các tác nhân](#các-tác-nhân)
  - [Thiết kế hệ thống](#thiết-kế-hệ-thống)
    - [Kiến trúc tổng thể](#kiến-trúc-tổng-thể)
    - [Sơ đồ Use Case](#sơ-đồ-use-case)
    - [Ghi chú thiết kế cơ sở dữ liệu](#ghi-chú-thiết-kế-cơ-sở-dữ-liệu)
    - [Lưu ý bảo mật](#lưu-ý-bảo-mật)
    - [Tích hợp bên thứ ba](#tích-hợp-bên-thứ-ba)
  - [Sơ đồ tuần tự các use case chính](#sơ-đồ-tuần-tự-các-use-case-chính)
    - [1. Sơ đồ tuần tự: Gửi đề xuất công tác](#1-sơ-đồ-tuần-tự-gửi-đề-xuất-công-tác)
    - [2. Sơ đồ tuần tự: Chấm công (Check-in/Check-out) tại địa điểm công tác](#2-sơ-đồ-tuần-tự-chấm-công-check-incheck-out-tại-địa-điểm-công-tác)
    - [3. Sơ đồ tuần tự: Báo cáo nội dung công tác](#3-sơ-đồ-tuần-tự-báo-cáo-nội-dung-công-tác)
    - [4. Sơ đồ tuần tự: Nhận công tác hoặc thông báo](#4-sơ-đồ-tuần-tự-nhận-công-tác-hoặc-thông-báo)
    - [5. Sơ đồ tuần tự: Phân công công tác](#5-sơ-đồ-tuần-tự-phân-công-công-tác)
    - [6. Sơ đồ tuần tự: Phê duyệt đề xuất công tác](#6-sơ-đồ-tuần-tự-phê-duyệt-đề-xuất-công-tác)
    - [7. Sơ đồ tuần tự: Giám sát công tác của nhân viên](#7-sơ-đồ-tuần-tự-giám-sát-công-tác-của-nhân-viên)
    - [8. Sơ đồ tuần tự: Tổng hợp dữ liệu và xuất báo cáo công tác](#8-sơ-đồ-tuần-tự-tổng-hợp-dữ-liệu-và-xuất-báo-cáo-công-tác)
  - [Sơ đồ hoạt động chính của hệ thống](#sơ-đồ-hoạt-động-chính-của-hệ-thống)
    - [1. Gửi đề xuất công tác](#1-gửi-đề-xuất-công-tác)
    - [2. Chấm công (Check-in/Check-out)](#2-chấm-công-check-incheck-out)
    - [3. Báo cáo nội dung công tác](#3-báo-cáo-nội-dung-công-tác)
    - [4. Nhận công tác hoặc thông báo](#4-nhận-công-tác-hoặc-thông-báo)
    - [5. Phân công công tác](#5-phân-công-công-tác)
    - [6. Phê duyệt đề xuất công tác](#6-phê-duyệt-đề-xuất-công-tác)
    - [7. Giám sát công tác của nhân viên](#7-giám-sát-công-tác-của-nhân-viên)
    - [8. Tổng hợp dữ liệu và xuất báo cáo công tác](#8-tổng-hợp-dữ-liệu-và-xuất-báo-cáo-công-tác)
  - [Sơ đồ lớp hệ thống (Class Diagram)](#sơ-đồ-lớp-hệ-thống-class-diagram)
  - [Sơ đồ trạng thái chính của hệ thống](#sơ-đồ-trạng-thái-chính-của-hệ-thống)
    - [1. Sơ đồ trạng thái của Trip (Chuyến công tác)](#1-sơ-đồ-trạng-thái-của-trip-chuyến-công-tác)
    - [2. Sơ đồ trạng thái của Task (Nhiệm vụ)](#2-sơ-đồ-trạng-thái-của-task-nhiệm-vụ)
    - [3. Sơ đồ trạng thái của TripApproval (Phê duyệt công tác)](#3-sơ-đồ-trạng-thái-của-tripapproval-phê-duyệt-công-tác)
    - [4. Sơ đồ trạng thái của Notification (Thông báo)](#4-sơ-đồ-trạng-thái-của-notification-thông-báo)
    - [5. Sơ đồ trạng thái của Proof (Minh chứng)](#5-sơ-đồ-trạng-thái-của-proof-minh-chứng)

<!-- /code_chunk_output -->

---

## Phân tích hệ thống

### Các tác nhân

**Người dùng ứng dụng di động (Nhân viên):**

- Đăng ký và báo cáo chuyến công tác.
- Chấm công (Check-in/Check-out) bằng GPS.
- Tải lên minh chứng bằng ảnh/video.
- Nhận thông báo.
- Xem lịch sử công tác.

**Người dùng ứng dụng web (Quản lý):**

- Quản lý người dùng và phân quyền.
- Phân công và phê duyệt chuyến công tác.
- Giám sát vị trí và báo cáo của nhân viên.
- Xuất báo cáo tổng hợp.

---

##  Thiết kế hệ thống

### Kiến trúc tổng thể

```mermaid
flowchart LR
  subgraph Client
    MobileApp[Ứng dụng di động <React Native>]
    WebApp[Ứng dụng Web <ReactJS>]
  end

  subgraph Gateway
    APIGateway[API Gateway]
  end

  subgraph Auth
    UserService[Dịch vụ Người dùng]
    UserDB[(CSDL Người dùng)]
  end

  subgraph Trip
    TripService[Dịch vụ Công tác]
    TripDB[(CSDL Công tác)]
  end

  subgraph Planning
    TripPlannerService[Dịch vụ Lập kế hoạch công tác]
    PlannerDB[(CSDL Lập kế hoạch)]
  end

  subgraph Location
    LocationService[Dịch vụ Vị trí]
    LocationDB[(CSDL Vị trí)]
  end

  subgraph Proof
    ProofService[Dịch vụ Minh chứng]
    ProofDB[(CSDL Minh chứng)]
  end

  subgraph GPS
    GPSService[Dịch vụ Theo dõi GPS]
    GPSDB[(CSDL GPS)]
  end

  subgraph Notification
    NotificationService[Dịch vụ Thông báo]
    NotificationDB[(CSDL Thông báo)]
  end

  subgraph Reporting
    ReportService[Dịch vụ Báo cáo]
    ReportDB[(CSDL Báo cáo)]
  end

  subgraph Audit
    AuditService[Dịch vụ Nhật ký kiểm tra]
    AuditDB[(CSDL Nhật ký)]
  end

  Client --> APIGateway

  APIGateway --> UserService
  APIGateway --> TripService
  APIGateway --> TripPlannerService
  APIGateway --> LocationService
  APIGateway --> ProofService
  APIGateway --> GPSService
  APIGateway --> NotificationService
  APIGateway --> ReportService
  APIGateway --> AuditService

  UserService --> UserDB
  TripService --> TripDB
  TripPlannerService --> PlannerDB
  LocationService --> LocationDB
  ProofService --> ProofDB
  GPSService --> GPSDB
  NotificationService --> NotificationDB
  ReportService --> ReportDB
  AuditService --> AuditDB
```

### Sơ đồ Use Case

**Use Case của Nhân viên (Ứng dụng di động)**

```mermaid
graph LR
  A[Nhân viên <Ứng dụng di động>] --> B[Đăng nhập]
  A --> C[Đăng xuất]
  A --> D[Đăng ký chuyến công tác]
  A --> E[Check-in tại địa điểm công tác]
  A --> F[Check-out tại địa điểm công tác]
  A --> G[Theo dõi di chuyển qua GPS]
  A --> H[Gửi báo cáo công tác]
  H --> I[Đính kèm minh chứng]
  A --> J[Nhận thông báo]
  A --> K[Xem lịch sử công tác]
```

**Use Case của Quản lý (Ứng dụng Web)**

```mermaid
graph LR
  M[Quản lý <Ứng dụng Web>] --> N[Đăng nhập]
  M --> O[Đăng xuất]
  M --> P[Quản lý người dùng và vai trò]
  M --> Q[Phân công công tác cho nhân viên]
  M --> R[Phê duyệt/Từ chối đề xuất công tác]
  M --> S[Xem vị trí nhân viên theo thời gian thực]
  M --> T[Xem báo cáo công tác]
  T --> U[Xem minh chứng]
  M --> V[Xuất báo cáo ra CSV/Excel]
  M --> W[Gửi thông báo cho nhân viên]
```

### Ghi chú thiết kế cơ sở dữ liệu
- Sử dụng MySQL cho dữ liệu giao dịch (người dùng, chuyến công tác, chấm công).
- Lưu trữ file minh chứng trên Google Cloud Storage.
- Sử dụng Redis để cache thông báo hoặc toạ độ GPS hiện tại cho bản đồ trực tuyến.

### Lưu ý bảo mật
- Sử dụng xác thực JWT.
- Phân quyền dựa trên vai trò (RBAC): Quản lý và Nhân viên.
- Kiểm tra dữ liệu tải lên (kích thước, định dạng).
- Đảm bảo truy cập an toàn tới cloud storage (signed URL hoặc phân quyền bucket).

### Tích hợp bên thứ ba
- OpenStreetMap + Leaflet.js: Hiển thị bản đồ và lộ trình công tác.
- Firebase Cloud Messaging (Tùy chọn): Gửi thông báo thời gian thực cho di động.

## Sơ đồ tuần tự các use case chính

### 1. Sơ đồ tuần tự: Gửi đề xuất công tác

```mermaid
sequenceDiagram
    actor N as Nhân viên
    participant APP as Ứng dụng di động
    participant HT as Hệ thống
    actor QL as Người quản lý
    participant WEB as Ứng dụng Web

    N->>APP: Chọn "Gửi đề xuất công tác"
    APP->>N: Hiển thị biểu mẫu đề xuất
    N->>APP: Nhập thông tin (Mục đích, Thời gian, Địa điểm,...)
    APP->>HT: Gửi đề xuất công tác
    HT->>HT: Lưu đề xuất (Trạng thái: Chờ duyệt)
    HT->>QL: Gửi thông báo đề xuất mới
    QL->>WEB: Chấp nhận/từ chối đề xuất
    HT->>APP: Cập nhật trạng thái đề xuất
    APP->>N: Hiển thị xác nhận đề xuất đã gửi
```

-----

### 2. Sơ đồ tuần tự: Chấm công (Check-in/Check-out) tại địa điểm công tác

```mermaid
sequenceDiagram
    actor N as Nhân viên
    participant APP as Ứng dụng di động
    participant HT as Hệ thống

    N->>APP: Đến/Rời khu vực công tác
    N->>APP: Chọn "Check-in" hoặc "Check-out"
    APP->>APP: Lấy vị trí GPS hiện tại
    APP->>HT: Gửi dữ liệu chấm công (vị trí, thời gian)
    HT->>HT: Lưu thông tin chấm công
    HT-->>APP: Phản hồi xác nhận chấm công
    APP->>N: Hiển thị xác nhận chấm công thành công
```

-----

### 3. Sơ đồ tuần tự: Báo cáo nội dung công tác

```mermaid
sequenceDiagram
    actor N as Nhân viên
    participant APP as Ứng dụng di động
    participant HT as Hệ thống
    actor QL as Người quản lý

    N->>APP: Chọn "Báo cáo công tác"
    APP->>N: Hiển thị biểu mẫu báo cáo
    N->>APP: Nhập nội dung báo cáo (Mục tiêu đạt, Đang thực hiện, Đề xuất hủy)
    N->>APP: Đính kèm minh chứng (Ảnh/Video, vị trí, thời gian)
    APP->>HT: Gửi báo cáo kèm minh chứng
    HT->>HT: Lưu báo cáo và minh chứng
    HT->>QL: Gửi thông báo báo cáo mới
    HT-->>APP: Phản hồi xác nhận báo cáo
    APP->>N: Hiển thị xác nhận báo cáo đã gửi
```

-----

### 4. Sơ đồ tuần tự: Nhận công tác hoặc thông báo

```mermaid
sequenceDiagram
    participant HT as Hệ thống
    actor N as Nhân viên
    participant APP as Ứng dụng di động

    HT->>APP: Gửi thông báo (Công tác mới / Phê duyệt / Chỉ thị)
    APP->>N: Hiển thị thông báo trên thiết bị
    N->>APP: Chọn thông báo để xem
    APP->>N: Hiển thị chi tiết thông báo
```

-----

### 5. Sơ đồ tuần tự: Phân công công tác

```mermaid
sequenceDiagram
    actor QL as Người quản lý
    participant WEB as Ứng dụng Web
    participant HT as Hệ thống
    actor N as Nhân viên
    participant APP as Ứng dụng di động

    QL->>WEB: Đăng nhập
    QL->>WEB: Chọn "Phân công công tác"
    WEB->>QL: Hiển thị biểu mẫu phân công
    QL->>WEB: Nhập chi tiết công tác (Kế hoạch, Thời hạn, Vị trí,...)
    QL->>WEB: Chọn nhân viên được giao
    WEB->>HT: Gửi phân công công tác
    HT->>HT: Lưu thông tin phân công
    HT->>APP: Gửi thông báo công tác mới
    APP->>N: Hiển thị thông báo công tác mới
    HT-->>WEB: Phản hồi xác nhận phân công
    WEB->>QL: Hiển thị xác nhận phân công thành công
```

-----

### 6. Sơ đồ tuần tự: Phê duyệt đề xuất công tác

```mermaid
sequenceDiagram
    actor QL as Người quản lý
    participant WEB as Ứng dụng Web
    participant HT as Hệ thống
    actor N as Nhân viên
    participant APP as Ứng dụng di động

    QL->>WEB: Nhận thông báo đề xuất mới (qua HT)
    QL->>WEB: Chọn "Phê duyệt công tác"
    WEB->>HT: Yêu cầu danh sách đề xuất chờ duyệt
    HT->>WEB: Trả về danh sách đề xuất
    WEB->>QL: Hiển thị danh sách đề xuất
    QL->>WEB: Chọn đề xuất để xem chi tiết
    WEB->>HT: Yêu cầu chi tiết đề xuất
    HT->>WEB: Trả về chi tiết đề xuất
    WEB->>QL: Hiển thị chi tiết đề xuất
    QL->>WEB: Chọn "Duyệt" hoặc "Từ chối" (kèm lý do nếu từ chối)
    WEB->>HT: Gửi quyết định phê duyệt/từ chối
    HT->>HT: Cập nhật trạng thái đề xuất
    HT->>APP: Gửi thông báo kết quả phê duyệt
    APP->>N: Hiển thị thông báo kết quả phê duyệt
    HT-->>WEB: Phản hồi xác nhận
    WEB->>QL: Hiển thị xác nhận phê duyệt/từ chối thành công
```

-----

### 7. Sơ đồ tuần tự: Giám sát công tác của nhân viên

```mermaid
sequenceDiagram
    actor QL as Người quản lý
    participant WEB as Ứng dụng Web
    participant HT as Hệ thống
    actor N as Nhân viên
    participant APP as Ứng dụng di động

    QL->>WEB: Đăng nhập
    QL->>WEB: Chọn "Giám sát công tác"
    WEB->>HT: Yêu cầu dữ liệu vị trí GPS hiện tại (từ APP)
    HT->>APP: Yêu cầu cập nhật GPS (định kỳ)
    APP->>HT: Gửi vị trí GPS
    HT->>WEB: Trả về dữ liệu vị trí GPS
    WEB->>WEB: Hiển thị vị trí nhân viên trên bản đồ (OpenStreetMap)
    QL->>WEB: Chọn nhân viên/báo cáo để xem chi tiết
    WEB->>HT: Yêu cầu báo cáo/minh chứng chi tiết
    HT->>WEB: Trả về chi tiết báo cáo (ảnh, video, vị trí)
    WEB->>QL: Hiển thị chi tiết báo cáo và minh chứng
```

-----

### 8. Sơ đồ tuần tự: Tổng hợp dữ liệu và xuất báo cáo công tác

```mermaid
sequenceDiagram
    actor QL as Người quản lý
    participant WEB as Ứng dụng Web
    participant HT as Hệ thống

    QL->>WEB: Đăng nhập
    QL->>WEB: Chọn "Tổng hợp dữ liệu / Xuất báo cáo"
    WEB->>QL: Hiển thị tùy chọn lọc (Thời gian, Nhân viên,...)
    QL->>WEB: Thiết lập bộ lọc và chọn định dạng (CSV/Excel)
    WEB->>HT: Yêu cầu tổng hợp dữ liệu theo bộ lọc
    HT->>HT: Truy vấn và xử lý dữ liệu công tác
    HT->>WEB: Trả về dữ liệu tổng hợp
    WEB->>WEB: Tạo file báo cáo (CSV/Excel)
    WEB->>QL: Cho phép tải về file báo cáo
    QL->>WEB: Tải về file báo cáo
```

---

## Sơ đồ hoạt động chính của hệ thống

### 1. Gửi đề xuất công tác

```mermaid
stateDiagram-v2
    [*] --> ChonGuiDeXuat: Nhân viên chọn<br/> "Gửi đề xuất công tác"
    ChonGuiDeXuat --> HienThiForm: Hiển thị biểu mẫu đề xuất
    HienThiForm --> NhapThongTin: Nhập thông tin đề xuất
    NhapThongTin --> GuiDeXuat: Gửi đề xuất lên hệ thống
    GuiDeXuat --> LuuDeXuat: Hệ thống lưu đề xuất<br/> (Chờ duyệt)
    LuuDeXuat --> GuiThongBao: Gửi thông báo cho quản lý
    GuiThongBao --> QL_PheDuyet: Quản lý phê duyệt/từ chối?
    QL_PheDuyet --> CapNhatTrangThai: Đúng / Cập nhật trạng thái đề xuất
    QL_PheDuyet --> [*]: Từ chối / Kết thúc
    CapNhatTrangThai --> XacNhan: Hiển thị xác nhận cho nhân viên
    XacNhan --> [*]
```

### 2. Chấm công (Check-in/Check-out)

```mermaid
stateDiagram-v2
    [*] --> DenDiaDiem: Nhân viên đến/rời<br/> địa điểm công tác
    DenDiaDiem --> ChonCheck: Chọn "Check-in" <br/>hoặc "Check-out"
    ChonCheck --> LayGPS: Lấy vị trí GPS hiện tại
    LayGPS --> GuiChamCong: Gửi dữ liệu chấm công<br/> lên hệ thống
    GuiChamCong --> LuuChamCong: Hệ thống lưu thông tin<br/> chấm công
    LuuChamCong --> PhanHoi: Phản hồi xác nhận <br/>cho ứng dụng
    PhanHoi --> HienThiXacNhan: Hiển thị xác nhận <br/>cho nhân viên
    HienThiXacNhan --> [*]
```

### 3. Báo cáo nội dung công tác

```mermaid
stateDiagram-v2
    [*] --> ChonBaoCao: Nhân viên chọn<br/> "Báo cáo công tác"
    ChonBaoCao --> HienThiForm: Hiển thị biểu mẫu báo cáo
    HienThiForm --> NhapNoiDung: Nhập nội dung báo cáo
    NhapNoiDung --> DinhKem: Đính kèm minh chứng<br/>(ảnh/video, vị trí, thời gian)
    DinhKem --> GuiBaoCao: Gửi báo cáo lên hệ thống
    GuiBaoCao --> LuuBaoCao: Hệ thống lưu báo cáo và minh chứng
    LuuBaoCao --> GuiThongBao: Gửi thông báo cho quản lý
    GuiThongBao --> PhanHoi: Phản hồi xác nhận cho ứng dụng
    PhanHoi --> HienThiXacNhan: Hiển thị xác nhận cho nhân viên
    HienThiXacNhan --> [*]
```

### 4. Nhận công tác hoặc thông báo

```mermaid
stateDiagram-v2
    [*] --> GuiThongBao: Hệ thống gửi<br/> thông báo mới
    GuiThongBao --> HienThiThongBao: Ứng dụng hiển thị<br/> thông báo
    HienThiThongBao --> ChonThongBao: Nhân viên chọn<br/> thông báo để xem
    ChonThongBao --> HienThiChiTiet: Hiển thị chi tiết thông báo
    HienThiChiTiet --> [*]
```

### 5. Phân công công tác

```mermaid
stateDiagram-v2
    [*] --> QL_DangNhap: Quản lý đăng nhập<br/ hệ thống
    QL_DangNhap --> ChonPhanCong: Chọn "Phân công công tác"
    ChonPhanCong --> NhapChiTiet: Nhập chi tiết công tác,<br/> chọn nhân viên
    NhapChiTiet --> GuiPhanCong: Gửi phân công lên hệ thống
    GuiPhanCong --> LuuPhanCong: Hệ thống lưu<br/> thông tin phân công
    LuuPhanCong --> GuiThongBao: Gửi thông báo công tác mới<br/> cho nhân viên
    GuiThongBao --> XacNhan: Hiển thị xác nhận<br/> cho quản lý
    XacNhan --> [*]
```

### 6. Phê duyệt đề xuất công tác

```mermaid
stateDiagram-v2
    [*] --> QL_NhanThongBao: Quản lý nhận thông báo<br/> đề xuất mới
    QL_NhanThongBao --> ChonPheDuyet: Chọn "Phê duyệt công tác"
    ChonPheDuyet --> XemDanhSach: Xem danh sách đề xuất<br/> chờ duyệt
    XemDanhSach --> XemChiTiet: Xem chi tiết đề xuất
    XemChiTiet --> QL_QuyetDinh: Quản lý chọn "Duyệt"<br/> hoặc "Từ chối"
    QL_QuyetDinh --> CapNhatTrangThai: Gửi quyết định lên hệ thống
    CapNhatTrangThai --> GuiThongBao: Hệ thống cập nhật<br/> trạng thái, gửi thông báo<br/> kết quả cho nhân viên
    GuiThongBao --> XacNhan: Hiển thị xác nhận<br/> cho quản lý
    XacNhan --> [*]
```

### 7. Giám sát công tác của nhân viên

```mermaid
stateDiagram-v2
    [*] --> QL_DangNhap: Quản lý đăng nhập<br/> hệ thống
    QL_DangNhap --> ChonGiamSat: Chọn "Giám sát công tác"
    ChonGiamSat --> YeuCauGPS: Yêu cầu dữ liệu vị trí GPS
    YeuCauGPS --> LayGPS: Hệ thống lấy dữ liệu GPS<br/> từ ứng dụng nhân viên
    LayGPS --> HienThiBanDo: Hiển thị vị trí nhân viên<br/> trên bản đồ
    HienThiBanDo --> ChonXemChiTiet: Chọn nhân viên/báo cáo<br/> để xem chi tiết
    ChonXemChiTiet --> XemBaoCao: Xem chi tiết báo cáo,<br/> minh chứng
    XemBaoCao --> [*]
```

### 8. Tổng hợp dữ liệu và xuất báo cáo công tác

```mermaid
stateDiagram-v2
    [*] --> QL_DangNhap: Quản lý đăng nhập hệ thống
    QL_DangNhap --> ChonTongHop: Chọn "Tổng hợp dữ liệu"<br/> hoặc "Xuất báo cáo"
    ChonTongHop --> ThietLapBoLoc: Thiết lập bộ lọc,<br/> chọn định dạng báo cáo
    ThietLapBoLoc --> YeuCauTongHop: Yêu cầu hệ thống<br/> tổng hợp dữ liệu
    YeuCauTongHop --> XuLyDuLieu: Hệ thống truy vấn<br/> và xử lý dữ liệu
    XuLyDuLieu --> TaoFile: Tạo file báo cáo<br/> (CSV/Excel)
    TaoFile --> ChoPhepTai: Cho phép tải về file báo cáo
    ChoPhepTai --> [*]
```

---

## Sơ đồ lớp hệ thống (Class Diagram)

**Các lớp Enum:**

```mermaid
classDiagram
    class trip_status {
        <<enumeration>>
        -pending
        -accepted
        -in_progress
        -completed
        -canceled
    }
    class task_status {
        <<enumeration>>
        -pending
        -completed
        -cancelled
    }
    class proof_type {
        <<enumeration>>
        -completion
        -cancellation
    }
    class media_type {
        <<enumeration>>
        -photo
        -video
    }
    class approval_status {
        <<enumeration>>
        -pending
        -approved
        -rejected
        -auto_approved
    }
```

**Các lớp chính của hệ thống:**

```mermaid
classDiagram
    direction TB
    %% ROLES & PERMISSIONS
    class Role {
        -id: int
        -name: string
        -description: string
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }
    class Permission {
        -id: int
        -action: string
        -resource: string
        -description: string
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }
    class RolePermission {
        -role_id: int
        -permission_id: int
        -created_at: datetime
        -updated_at: datetime
    }

    %% USERS
    class User {
        -id: int
        -first_name: string
        -last_name: string
        -citizen_id: string
        -phone_number: string
        -gender: string
        -date_of_birth: date
        -email: string
        -password: string
        -role_id: int
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }

    %% LOCATIONS
    class Location {
        -id: int
        -name: string
        -latitude: decimal
        -longitude: decimal
        -offset_radius: float
        -location: point
        -created_by: int
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }

    %% TRIPS
    class Trip {
        -id: int
        -assignee_id: int
        -status: trip_status
        -purpose: string
        -goal: string
        -schedule: string
        -created_by: int
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }

    class TripLocation {
        -id: int
        -trip_id: int
        -location_id: int
        -arrival_order: int
        -scheduled_at: datetime
        -created_at: datetime
        -updated_at: datetime
        -deleted_at: datetime
    }

    class TripApproval {
        -id: int
        -trip_id: int
        -approver_id: int
        -status: approval_status
        -note: string
        -is_auto: bool
        -created_at: datetime
    }

    %% TASKS
    class Task {
        -id: int
        -trip_location_id: int
        -title: string
        -description: string
        -status: task_status
        -note: string
        -deadline: datetime
        -completed_at: datetime
        -cancelled_at: datetime
        -cancel_reason: string
        -created_at: datetime
        -updated_at: datetime
    }

    class TaskProof {
        -id: int
        -task_id: int
        -type: proof_type
        -media_url: string
        -media_type: media_type
        -latitude: decimal
        -longitude: decimal
        -timestamp: datetime
        -uploaded_by: int
        -location_point: point
        -created_at: datetime
    }

    %% GPS LOGS
    class GPSLog {
        -id: int
        -trip_id: int
        -user_id: int
        -latitude: decimal
        -longitude: decimal
        -timestamp: datetime
        -location_point: point
    }

    %% EXPORT LOGS
    class ExportLog {
        -id: int
        -requested_by: int
        -export_type: string
        -filter_params: string
        -file_url: string
        -created_at: datetime
    }

    %% AUDIT LOGS
    %% class AuditLog {
    %%     -id: int
    %%     -user_id: int
    %%     -action: string
    %%     -entity: string
    %%     -entity_id: int
    %%     -description: string
    %%     -created_at: datetime
    %% }

    %% NOTIFICATIONS
    class Notification {
        -id: int
        -user_id: int
        -message: string
        -is_read: bool
        -created_at: datetime
    }

    %% RELATIONSHIPS
    %% Role -< User (1-n)
    Role "1" o-- "*" User : "assigned to"
    %% Role -< RolePermission >- Permission (n-n)
    Role "1" o-- "*" RolePermission : "has"
    Permission "1" o-- "*" RolePermission : "granted to"
    %% User -< Trip (1-n)
    User "1" o-- "*" Trip : "created by"
    %% User -< Location (1-n)
    User "1" o-- "*" Location : "created by"
    %% User -< TripApproval (1-n)
    User "1" o-- "*" TripApproval : "approves"
    %% User -< GPSLog (1-n)
    User "1" o-- "*" GPSLog : "logs"
    %% User -< ExportLog (1-n)
    User "1" o-- "*" ExportLog : "requests"
    %% User -< AuditLog (1-n)
    %% User "1" o-- "*" AuditLog : "actions"
    %% User -< Notification (1-n)
    User "1" o-- "*" Notification : "receives"
    %% User -< TaskProof (1-n)
    User "1" o-- "*" TaskProof : "uploads"

    %% Trip -< TripLocation (1-n)
    Trip "1" o-- "*" TripLocation : "includes"
    %% Trip -< TripApproval (1-n)
    Trip "1" o-- "*" TripApproval : "has"
    %% Trip -< GPSLog (1-n)
    Trip "1" o-- "*" GPSLog : "tracks"
    %% TripLocation -< Task (1-n)
    TripLocation "1" o-- "*" Task : "has"
    %% TripLocation >-- Location : "at" %% composition (TripLocation contains Location)
    TripLocation "*" *-- "1" Location : "at"
    %% Task -< TaskProof (1-n)
    Task "1" o-- "*" TaskProof : "has"
```

---

## Sơ đồ trạng thái chính của hệ thống

### 1. Sơ đồ trạng thái của Trip (Chuyến công tác)

```mermaid
stateDiagram-v2
    [*] --> pending : Tạo mới
    pending --> accepted : Được phê duyệt
    pending --> canceled : Bị hủy
    accepted --> in_progress : Bắt đầu công tác
    in_progress --> completed : Hoàn thành công tác
    in_progress --> canceled : Hủy trong quá trình
    accepted --> canceled : Hủy trước khi bắt đầu
```

### 2. Sơ đồ trạng thái của Task (Nhiệm vụ)

```mermaid
stateDiagram-v2
    [*] --> pending : Tạo mới
    pending --> completed : Đánh dấu hoàn thành
    pending --> cancelled : Hủy nhiệm vụ
    completed --> cancelled : Hủy sau khi hoàn thành (nếu có rollback)
```

### 3. Sơ đồ trạng thái của TripApproval (Phê duyệt công tác)

```mermaid
stateDiagram-v2
    [*] --> pending : Chờ phê duyệt
    pending --> approved : Được phê duyệt
    pending --> rejected : Bị từ chối
    pending --> auto_approved : Tự động phê duyệt
```

### 4. Sơ đồ trạng thái của Notification (Thông báo)

```mermaid
stateDiagram-v2
    [*] --> unread : Tạo mới
    unread --> read : Người dùng đã đọc
```

### 5. Sơ đồ trạng thái của Proof (Minh chứng)

```mermaid
stateDiagram-v2
    [*] --> completion : Nộp minh chứng hoàn thành
    [*] --> cancellation : Nộp minh chứng hủy
```

