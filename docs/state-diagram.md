# State diagram

Trip status

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    state if_state2 <<choice>>
    state if_state3 <<choice>>
    [*] --> if_state
    if_state --> waiting_for_approval: employee proposed
    waiting_for_approval --> not_started: manager approved
    if_state --> not_started: manager assigned<br/>to an employee
    waiting_for_approval --> not_approved: manager rejected
    not_started --> in_progress: employee start trip
    not_started --> if_state2: request to<br/>cancel
    if_state2 --> not_started: rejected
    if_state2 --> canceled: approved
    in_progress --> if_state3: request to cancel
    if_state3 --> not_started: rejected
    if_state3 --> canceled: approved
    in_progress --> ended: employee finished<br/>all the work
    not_approved --> [*]
    canceled --> [*]
    ended --> [*]
```

Task state

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    [*] --> pending: task created
    pending --> if_state: request to<br/>cancel task
    pending --> completed: employee completed<br/>the task
    if_state --> pending: rejected
    if_state --> canceled: approved
    completed --> [*]
    canceled --> [*]
```

Cancelation

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    [*] --> not_resolved: manager/employee<br/>created request
    not_resolved --> if_state
    if_state --> approved: manager approve<br/>request
    if_state --> rejected: manager reject<br/>request
    approved --> [*]
    rejected --> [*]
```

