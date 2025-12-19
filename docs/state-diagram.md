# State diagram

Trip status

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    [*] --> if_state
    if_state --> waiting_for_approval: employee proposed
    if_state --> not_started: manager assigned<br/>to an employee
    waiting_for_approval --> [*]: manager rejected
    waiting_for_approval --> not_started: manager approved
    not_started --> canceled: employee/manager<br/>cancel the trip
    not_started --> in_progress: employee begin to work
    in_progress --> completed: employee completed<br/>all the work
    canceled --> [*]
    completed --> [*]
```

Task state

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED: Tạo mới
    NOT_STARTED --> IN_PROGRESS: Nhân viên bắt đầu làm việc
    IN_PROGRESS --> COMPLETED: Hoàn thành công việc
    COMPLETED --> [*]
```

0. (Trip đã tạo/đã được approved) Trạng thái lúc này là not_started
1. Bắt đầu trip -> PATCH /trips/{id} {status = 'in_progress'}
    - Hệ thống tự update progress
2. User check-in địa điểm X
    - Chụp/chọn minh chứng
    - Call API gửi minh chứng: POST /media (bỏ cái query param task-id đi, form data giữ nguyên)
    - Call API check-in-> PATCH /trips/locations/check-in { tripLocationId: 'xxx', latitude: x, longitude: y, timestamp: new Date(), attachmentId: 'xxx' } (Thêm field attachmentId để lưu minh chứng check-in)
3. User check-out địa điểm X
    - Chụp/chọn minh chứng
    - Call API gửi minh chứng: POST /media (bỏ cái query param task-id đi, form data giữ nguyên)
    - Call API check-out-> PATCH /trips/locations/check-out { tripLocationId: 'xxx', latitude: x, longitude: y, timestamp: new Date(), attachmentId: 'xxx' } (Thêm field attachmentId để lưu minh chứng check-in)
4. User hoàn thành công tác -> PATCH /trips/{id} {status = 'completed'}
5. Nếu employee cần hủy công tác đột xuất (các role khác đều dùng chung api này luôn)
    Call API -> PATCH /trips/{id} {status = 'canceled', attachmentId: 'xxx', note: 'Lí do cancel nằm đây'} (Thêm 2 field để lưu minh chứng + ghi chú)
