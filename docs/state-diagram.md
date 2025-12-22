# State diagram

Trip status

```mermaid
stateDiagram-v2
    state if_state <<choice>>
    [*] --> if_state
    if_state --> waiting_for_approval: employee proposed
    if_state --> not_started: manager assigned<br/>to an employee
    waiting_for_approval --> not_approved: manager rejected
    waiting_for_approval --> not_started: manager approved
    not_started --> canceled: employee/manager<br/>cancel the trip
    not_started --> in_progress: employee begin to work
    in_progress --> ended: employee finished<br/>all the work
    not_approved --> [*]
    canceled --> [*]
    ended --> [*]
```

Task state

```mermaid
stateDiagram-v2
    [*] --> pending: task created
    pending --> completed: employee completed<br/>the task
    pending --> canceled: employee/manager<br/>canceled task
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

