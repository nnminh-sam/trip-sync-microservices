# Task Service Enhancement Implementation Plan

This guide provides a step-by-step plan to enhance the Task and Task-Proof services to meet all requirements specified in the system design documents.

## Overview

The Task Service requires significant enhancements to support proper business logic, validations, cross-service communication, and authorization. This plan is divided into phases to ensure systematic implementation.

---

## Phase 1: Model and Database Enhancements ✅

### Task Model Updates
- [x] Add database indexes for performance optimization (tripLocationId, status)

### Task-Proof Model Updates
- [x] Fix `locationPoint` field to use proper MySQL spatial type
- [x] Create database migration for model changes
- [x] Add composite index on (taskId, type) for query optimization

### Base Model Enhancement
- [x] Update BaseModel to include soft delete support methods
- [x] Add `isDeleted()` method to check deletion status
- [x] Override default TypeORM methods to respect soft deletes

---

## Phase 2: Business Logic Implementation

### Task Status Management
- [ ] Create `TaskStatusManager` service for status transition logic
- [ ] Implement status transition validation rules:
  - [ ] `pending` → `completed` (with completion proof)
  - [ ] `pending` → `cancelled` (with cancellation proof and reason)
  - [ ] Prevent invalid transitions (e.g., `completed` → `pending`)
- [ ] Auto-update timestamps based on status changes:
  - [ ] Set `completedAt` when status changes to `completed`
  - [ ] Set `canceledAt` when status changes to `cancelled`
- [ ] Require and validate `cancelReason` for cancellation

### Task Completion Requirements
- [ ] Create `completeTask(taskId, userId, proofData)` method
- [ ] Validate task has required completion proof before allowing completion
- [ ] Ensure only assigned user can complete their task
- [ ] Update task status and timestamps atomically

### Task Cancellation Requirements
- [ ] Create `cancelTask(taskId, userId, reason, proofData)` method
- [ ] Require cancellation reason and proof
- [ ] Validate only assigned user or manager can cancel
- [ ] Update status, timestamps, and reason atomically

---

## Phase 3: Service Layer Enhancements

### Task Service Updates
- [ ] Implement soft delete in `delete()` method
- [ ] Add `findActiveOnly` parameter to `find()` method
- [ ] Create `findByTripLocation(tripLocationId)` method
- [ ] Add `restoreTask(taskId)` method for soft delete recovery
- [ ] Implement proper error handling with specific error codes

### Task-Proof Service Updates
- [ ] Fix `create()` method to properly set `taskId`
- [ ] Calculate and set `locationPoint` from latitude/longitude
- [ ] Complete soft delete implementation in `delete()` method
- [ ] Create `validateProofLocation(proof, task)` method
- [ ] Add bulk proof upload support

---

## Phase 4: Cross-Service Communication

### Trip Service Integration
- [ ] Create `TripServiceClient` for communication with Trip Service
- [ ] Implement `validateTripLocation(tripLocationId)` method
- [ ] Add caching for frequently accessed trip location data
- [ ] Handle Trip Service unavailability gracefully

### User Service Integration
- [ ] Create `UserServiceClient` for authorization checks
- [ ] Implement `getUserPermissions(userId)` method
- [ ] Add `validateUserTaskAccess(userId, taskId)` method
- [ ] Cache user permissions with TTL

### Location Service Integration
- [ ] Create `LocationServiceClient` for location validation
- [ ] Implement `validateProofLocation(latitude, longitude, locationId)` method
- [ ] Add location radius check for proof validation
- [ ] Handle location service errors gracefully


---

## Phase 6: API Enhancements

### Controller Updates
- [ ] Add proper request validation using class-validator
- [ ] Implement request sanitization
- [ ] Add response serialization to exclude sensitive fields

### New Endpoints
- [ ] Add `task.complete` endpoint for task completion
- [ ] Add `task.cancel` endpoint for task cancellation
- [ ] Add `task.restore` endpoint for soft delete recovery
- [ ] Add `proof.bulk_create` for multiple proof uploads
- [ ] Add `task.find_by_trip` for trip-specific tasks

### Error Handling
- [ ] Create custom RPC exceptions for different error types
- [ ] Implement consistent error response format
- [ ] Add request ID tracking for debugging
- [ ] Log all errors with context

---

## Phase 7: Data Validation and Business Rules

### Input Validation
- [ ] Validate deadline is in the future for new tasks
- [ ] Ensure task title uniqueness within trip location
- [ ] Validate proof media URLs format
- [ ] Check file size limits for proof uploads
- [ ] Validate GPS coordinates are valid

### Business Rule Implementation
- [ ] Tasks can only be created for active trips
- [ ] Completed tasks cannot be modified except by admin
- [ ] Proofs cannot be deleted after task completion
- [ ] Task deadline cannot be before trip start date
- [ ] Only one active task per location at a time

---

## Phase 8: Performance Optimization

### Database Optimization
- [ ] Add pagination metadata to list responses
- [ ] Implement cursor-based pagination for large datasets
- [ ] Add database query optimization hints
- [ ] Create materialized views for reporting

### Caching Strategy
- [ ] Implement Redis caching for frequently accessed data
- [ ] Cache task counts by status
- [ ] Cache user permissions
- [ ] Add cache invalidation logic

---

## Phase 9: Monitoring and Logging

### Logging Enhancement
- [ ] Add structured logging with correlation IDs
- [ ] Log all state changes with before/after values
- [ ] Implement audit trail for compliance
- [ ] Add performance metrics logging

### Monitoring Setup
- [ ] Add health check endpoints
- [ ] Implement readiness and liveness probes
- [ ] Add custom metrics for business KPIs
- [ ] Set up alerts for critical errors

---

## Phase 10: Testing and Documentation

### Unit Tests
- [ ] Write unit tests for all service methods (target 80% coverage)
- [ ] Test all status transition scenarios
- [ ] Test authorization logic
- [ ] Test error handling paths

### Integration Tests
- [ ] Test cross-service communication
- [ ] Test database transactions
- [ ] Test concurrent operations
- [ ] Test soft delete functionality

### Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document business rules and validations
- [ ] Create sequence diagrams for complex flows
- [ ] Write deployment and configuration guide

---

## Success Criteria

### Functional Requirements
- [ ] All tasks have proper status management with timestamps
- [ ] Soft delete works correctly for tasks and proofs
- [ ] Authorization prevents unauthorized access
- [ ] Cross-service validation works reliably
- [ ] All business rules are enforced

### Non-Functional Requirements
- [ ] API response time < 200ms for 95th percentile
- [ ] Service handles 1000 concurrent requests
- [ ] Zero data loss during migrations
- [ ] 99.9% uptime SLA maintained

---

## Notes

- Each phase should be completed and tested before moving to the next
- Create feature branches for each phase
- Conduct code reviews for all changes
- Update this checklist as implementation progresses
- Document any deviations from the plan
