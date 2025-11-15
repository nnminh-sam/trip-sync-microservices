# Trip Sync System Use Cases

---

<!-- @import "[TOC]" {cmd="toc" depthFrom=2 depthTo=6 orderedList=false} -->

<!-- code_chunk_output -->

- [Trip Sync System Use Cases Table](#trip-sync-system-use-cases-table)
- [User Service Use Cases](#user-service-use-cases)
  - [Employee](#employee)
  - [Manager](#manager)
- [Trip Service Use Cases](#trip-service-use-cases)
- [GPS Tracking Service Use Cases](#gps-tracking-service-use-cases)
- [Storage Service Use Cases](#storage-service-use-cases)
- [Proof Validation Use Cases](#proof-validation-use-cases)
- [Audit Log Service Use Cases](#audit-log-service-use-cases)
- [Notification Service Use Cases](#notification-service-use-cases)

<!-- /code_chunk_output -->

---

## Trip Sync System Use Cases Table

---

## User Service Use Cases

The user service orchestrates identity lifecycle, session management, and authorization controls that underpin both the employee mobile experience and the manager web console. Separate diagrams and descriptions call out the responsibilities and dependencies for each persona.

### Employee

```mermaid
graph LR
    %% Actor
    Employee((Employee))

    %% Use Cases
    subgraph "User Service — Employee"
        EmpLogin[Login]
        EmpLogout[Logout]
        EmpForgotPassword[Forgot Password]
        EmpExchangeToken[Exchange Token]
        EmpValidateToken[Validate Token]
    end

    %% Relationships
    Employee --> EmpLogin
    Employee --> EmpLogout
    Employee --> EmpForgotPassword
    Employee --> EmpExchangeToken
    EmpLogin -.include.-> EmpValidateToken
    EmpLogout -.include.-> EmpValidateToken
    EmpExchangeToken -.include.-> EmpValidateToken
```

Employees day-to-day usage stays within the user service as well: employees authenticate, refresh access tokens, reset forgotten passwords, and securely terminate sessions. Every path funnels through `Validate Token`, so downstream services can trust that location updates, trip interactions, and proof submissions originate from authenticated sessions.

### Manager

```mermaid
graph LR
    %% Actor
    Manager((Manager))

    %% Use Cases
    subgraph "User Service — Manager"
        MgrProvisionAccount[Provision Employee Account]
        MgrManageRoles[Manage Roles & Permissions]
        MgrRotateKeys[Rotate Public Keys]
        MgrLogin[Login]
        MgrLogout[Logout]
        MgrForgotPassword[Forgot Password]
        MgrExchangeToken[Exchange Token]
        MgrRevokeToken[Revoke Token]
        MgrValidateToken[Validate Token]
    end

    %% Relationships
    Manager --> MgrProvisionAccount
    Manager --> MgrManageRoles
    Manager --> MgrRotateKeys
    Manager --> MgrLogin
    Manager --> MgrLogout
    Manager --> MgrForgotPassword
    Manager --> MgrExchangeToken
    Manager --> MgrRevokeToken
    MgrLogin -.include.-> MgrValidateToken
    MgrLogout -.include.-> MgrValidateToken
    MgrExchangeToken -.include.-> MgrValidateToken
    MgrRevokeToken -.include.-> MgrValidateToken
```

Managers leverage the user service to administer the workforce as well as maintain their own authenticated access. Provisioning employees, assigning roles, and rotating public keys establish the security posture, while login, logout, password recovery, and token exchange oversee managerial sessions. The `Revoke Token` capability lets managers immediately invalidate compromised sessions, and the shared `Validate Token` pathway guarantees that privileged actions—like approving trips or reviewing proofs—are executed only by verified, authorized managers.

---

## Trip Service Use Cases

---

```mermaid
graph LR
    %% Actors
    Manager((Manager))
    Employee((Employee))

    %% Use Cases
    subgraph "Trip Service"
        DefineTrip[Define New Trip]
        ConfigureTripLocations[Configure Trip Locations]
        SelectExistingLocation[Select Existing Location]
        CreateLocation[Create New Location]
        AssignLocation[Assign Location to Trip]
        CreateLocationTasks[Create Tasks for Location]
        AssignTrip[Assign Trip to Employee]
        SuggestTrip[Suggest Trip Proposal]
        ApproveTrip[Approve or Reject<br/>Trip Suggestion]
        ViewTripDetails[View Trip Details]
        ViewLocationDetails[View Location Details]
        ViewTaskList[View Location Task List]
        UpdateTrip[Update Trip]
        UpdateTripLocations[Update Trip Locations]
        UpdateLocationTasks[Update Location Tasks]
    end

    %% Relationships
    Manager --> DefineTrip
    Manager --> ConfigureTripLocations
    Manager --> AssignLocation
    Manager --> CreateLocationTasks
    Manager --> AssignTrip
    Manager --> ApproveTrip
    Manager --> ViewTripDetails
    Manager --> UpdateTrip
    Employee --> SuggestTrip
    Employee --> ViewTripDetails
    DefineTrip -.include.-> ConfigureTripLocations
    ConfigureTripLocations -.extend.-> SelectExistingLocation
    ConfigureTripLocations -.extend.-> CreateLocation
    ConfigureTripLocations -.include.-> AssignLocation
    AssignLocation -.include.-> CreateLocationTasks
    UpdateTrip -.include.-> UpdateTripLocations
    UpdateTripLocations -.include.-> UpdateLocationTasks
    ViewTripDetails -.include.-> ViewLocationDetails
    ViewLocationDetails -.include.-> ViewTaskList
    ApproveTrip -.include.-> SuggestTrip
```

Trip creation starts with managers defining the trip scope and configuring its locations. During `Configure Trip Locations`, they either `Select Existing Location` records maintained by the service or `Create New Location` entries when operational sites are missing. Each selected location is formally attached through `Assign Location to Trip`, which immediately triggers `Create Tasks for Location` so managers can author the checklist that employees must fulfill on-site. Once the trip structure is ready, it can be assigned to an employee or left pending approval if the itinerary originated from an employee suggestion.

Both managers and employees can `View Trip Details`, which automatically expands into `View Location Details` and ultimately the `View Location Task List`. This ensures everyone sees the nested hierarchy of trip → locations → tasks without duplicative navigation. When changes arise, the `Update Trip` flow allows managers to adjust location assignments and task definitions via `Update Trip Locations` and `Update Location Tasks`, preserving the same structure. The service enforces immutability for deletions—trips, locations, and tasks cannot be removed once created—so updates focus on modifications rather than destructive operations.

## GPS Tracking Service Use Cases

---

```mermaid
graph LR
    %% Actors
    Manager((Manager))
    Employee((Employee))

    %% Use Cases
    subgraph "GPS Tracking Service"
        StreamLocation[Stream Real-Time Location]
        CheckInOut[Check-in / Check-out]
        GeofenceAlert[Generate Geofence Alerts]
        ViewLiveMap[View Live Map]
    end

    %% Relationships
    Employee --> StreamLocation
    Employee --> CheckInOut
    Manager --> ViewLiveMap
    ViewLiveMap -.extend.-> StreamLocation
    GeofenceAlert -.include.-> StreamLocation
    Manager --> GeofenceAlert
```

## Storage Service Use Cases

---

```mermaid
graph LR
    %% Actors
    Employee((Employee))
    ProofValidation((Proof Validation Service))

    %% Use Cases
    subgraph "Storage Service"
        UploadEvidence[Upload Proof Artifacts]
        RetrieveEvidence[Retrieve Proof Artifacts]
        ManageLifecycle[Manage Object Lifecycle]
    end

    %% Relationships
    Employee --> UploadEvidence
    ProofValidation --> RetrieveEvidence
    ProofValidation --> ManageLifecycle
    ManageLifecycle -.include.-> RetrieveEvidence
```

## Proof Validation Use Cases

---

```mermaid
graph LR
    %% Actors
    Manager((Manager))
    Employee((Employee))
    Storage((Storage Service))

    %% Use Cases
    subgraph "Proof Validation Service"
        ValidateWatermark[Validate Watermark & Metadata]
        VerifySignature[Verify GnuPG Signature]
        ApproveProof[Approve or Reject Proof]
        NotifyResult[Notify Validation Result]
    end

    %% Relationships
    Employee --> ApproveProof
    Manager --> ApproveProof
    Storage --> ValidateWatermark
    Storage --> VerifySignature
    ValidateWatermark -.include.-> VerifySignature
    ApproveProof -.include.-> ValidateWatermark
    ApproveProof -.include.-> VerifySignature
    NotifyResult -.extend.-> ApproveProof
```

## Audit Log Service Use Cases

---

```mermaid
graph LR
    %% Actors
    ComplianceOfficer((Compliance Officer))
    Manager((Manager))
    SystemActor((System Services))

    %% Use Cases
    subgraph "Audit Log Service"
        RecordEvent[Record Immutable Event]
        QueryAuditTrail[Query Audit Trail]
        GenerateReport[Generate Compliance Report]
    end

    %% Relationships
    SystemActor --> RecordEvent
    Manager --> QueryAuditTrail
    ComplianceOfficer --> QueryAuditTrail
    ComplianceOfficer --> GenerateReport
    GenerateReport -.include.-> QueryAuditTrail
```

## Notification Service Use Cases

---

```mermaid
graph LR
    %% Actors
    Manager((Manager))
    Employee((Employee))
    SystemActor((System Services))

    %% Use Cases
    subgraph "Notification Service"
        PublishEvent[Publish Notification Event]
        ManageChannels[Manage Delivery Channels]
        DeliverNotification[Deliver Notification]
        SubscribeUpdates[Subscribe to Notifications]
    end

    %% Relationships
    SystemActor --> PublishEvent
    Manager --> SubscribeUpdates
    Employee --> SubscribeUpdates
    DeliverNotification -.include.-> PublishEvent
    DeliverNotification -.include.-> ManageChannels
```
