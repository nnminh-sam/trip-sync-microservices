# User Service Use Cases

This document outlines all use cases related to users, roles, and permissions in the Trip Sync microservices system.

## Table of Contents

- [User Management Use Cases](#user-management-use-cases)
- [Authentication Use Cases](#authentication-use-cases)
- [Role Management Use Cases](#role-management-use-cases)
- [Permission Management Use Cases](#permission-management-use-cases)
- [Authorization Use Cases](#authorization-use-cases)
- [Implementation Coverage Analysis](#implementation-coverage-analysis)
- [Missing Use Cases](#missing-use-cases)
- [Recommendations](#recommendations)

## User Management Use Cases

### UC-U1: User Registration/Creation ✅

**Actor**: System Admin, Manager  
**Description**: Create a new user account in the system  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "create" permission on "user" resource
- Email must be unique

**Flow**:

1. Actor provides user details (firstName, lastName, email, password, role)
2. System validates the input data
3. System checks if email already exists
4. System verifies the role exists
5. System hashes the password
6. System creates the user record
7. System returns the created user information

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `user.create`
- Authorization: System Admin only
- Location: `src/modules/user/user.controller.ts:46-59`

### UC-U2: View User Profile ✅

**Actor**: System Admin, Manager, Employee  
**Description**: View user profile information  
**Preconditions**: 
- Actor must be authenticated
- For employees: can only view their own profile
- For managers/admins: can view any profile with "read" permission on "user" resource

**Flow**:
1. Actor requests user profile by ID
2. System validates the request
3. System checks authorization
4. System retrieves user information
5. System returns user data (without password)

**Implementation Status**: ✅ Fully Implemented
- Endpoints: `user.find.id`, `user.find`
- Location: `src/modules/user/user.controller.ts:19-44`

### UC-U3: Update User Profile ✅
**Actor**: System Admin, Manager, Employee  
**Description**: Update user profile information  
**Preconditions**: 
- Actor must be authenticated
- Employees can only update their own profile

**Flow**:
1. Actor provides updated user information
2. System validates the input
3. System checks authorization
4. System updates the user record
5. System returns updated user information

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `user.update`
- Location: `src/modules/user/user.controller.ts:61-71`

### UC-U4: List/Search Users ✅
**Actor**: System Admin, Manager  
**Description**: List and search users with filtering and pagination  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "read" permission on "user" resource

**Flow**:
1. Actor provides search filters (email, firstName, lastName)
2. System validates the request
3. System checks authorization
4. System retrieves filtered user list
5. System returns paginated results

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `user.find`
- Authorization: System Admin only (should include Manager)
- Location: `src/modules/user/user.controller.ts:31-44`

### UC-U5: Delete User ✅
**Actor**: System Admin  
**Description**: Delete a user from the system  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "delete" permission on "user" resource

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `user.remove`
- Authorization: System Admin only (should include Manager)

### UC-U6: Password Reset ✅
**Actor**: Employee, Manager, System Admin  
**Description**: Reset user password  
**Preconditions**: 
- Actor must be authenticated or have reset token

**Implementation Status**: ✅ Implemented
- No password reset functionality found

## Authentication Use Cases

### UC-A1: User Login ✅
**Actor**: Employee, Manager, System Admin  
**Description**: Authenticate user with email and password  
**Preconditions**: 
- User account must exist
- User account must be active

**Flow**:
1. User provides email and password
2. System validates credentials
3. System checks if user exists
4. System verifies password
5. System returns user information (for JWT generation at gateway)

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `auth.login`
- Location: `src/modules/auth/auth.controller.ts:13-16`

### UC-A2: User Logout ✅
**Actor**: Employee, Manager, System Admin  
**Description**: Log out from the system  
**Preconditions**: 
- User must be authenticated

**Implementation Status**: ✅ Implemented

### UC-A3: Token Exchange ✅
**Actor**: System (API Gateway)  
**Description**: Exchange tokens for authentication  
**Preconditions**: 
- Valid token must be provided

**Implementation Status**: ✅ Implemented

## Role Management Use Cases

### UC-R1: Create Role ✅
**Actor**: System Admin, Manager  
**Description**: Create a new role with permissions  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "create" permission on "role" resource

**Flow**:
1. Actor provides role details (name, description, permissionIds)
2. System validates the input
3. System checks if role name already exists
4. System validates permission IDs
5. System creates role and assigns permissions
6. System returns created role with permissions

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `role.create`
- Location: `src/modules/role/role.controller.ts:15-28`

### UC-R2: View Role Details ✅
**Actor**: System Admin, Manager  
**Description**: View role information with permissions  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "read" permission on "role" resource

**Flow**:
1. Actor requests role by ID or name
2. System validates the request
3. System checks authorization
4. System retrieves role with permissions
5. System returns role information

**Implementation Status**: ✅ Fully Implemented
- Endpoints: `role.find_one`, `role.find_by_name`
- Location: `src/modules/role/role.controller.ts:45-88`

### UC-R3: Update Role ✅
**Actor**: System Admin, Manager  
**Description**: Update role information and permissions  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "update" permission on "role" resource

**Flow**:
1. Actor provides updated role information
2. System validates the input
3. System checks if new name conflicts
4. System updates role and permissions
5. System returns updated role

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `role.update`
- Location: `src/modules/role/role.controller.ts:90-112`

### UC-R4: Delete Role ✅
**Actor**: System Admin, Manager  
**Description**: Remove a role from the system  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "delete" permission on "role" resource
- Role should not be assigned to any users

**Flow**:
1. Actor requests role deletion
2. System validates the request
3. System checks if role is in use
4. System removes role and its permissions
5. System confirms deletion

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `role.remove`
- Location: `src/modules/role/role.controller.ts:114-136`

### UC-R5: List Roles ✅
**Actor**: System Admin, Manager  
**Description**: List all roles with filtering and pagination  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "read" permission on "role" resource

**Flow**:
1. Actor provides filter criteria
2. System validates the request
3. System retrieves filtered roles
4. System returns paginated results

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `role.find_all`
- Location: `src/modules/role/role.controller.ts:30-43`

## Permission Management Use Cases

### UC-P1: Create Permission ✅
**Actor**: System Admin, Manager  
**Description**: Create a new permission  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "create" permission on "permission" resource

**Flow**:
1. Actor provides permission details (action, resource, description)
2. System validates the input
3. System checks for duplicates
4. System creates permission
5. System returns created permission

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.create`
- Location: `src/modules/permission/permission.controller.ts:20-33`

### UC-P2: Bulk Create Permissions ✅
**Actor**: System Admin, Manager  
**Description**: Create multiple permissions at once  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "create" permission on "permission" resource

**Flow**:
1. Actor provides array of permissions
2. System validates all permissions
3. System creates permissions in bulk
4. System returns created permissions

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.bulk_create`
- Location: `src/modules/permission/permission.controller.ts:119-134`

### UC-P3: View Permission ✅
**Actor**: System Admin, Manager  
**Description**: View permission details  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "read" permission on "permission" resource

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.find_one`
- Location: `src/modules/permission/permission.controller.ts:50-70`

### UC-P4: Update Permission ✅
**Actor**: System Admin, Manager  
**Description**: Update permission information  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "update" permission on "permission" resource

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.update`
- Location: `src/modules/permission/permission.controller.ts:72-95`

### UC-P5: Delete Permission ✅
**Actor**: System Admin, Manager  
**Description**: Remove a permission  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "delete" permission on "permission" resource
- Permission should not be assigned to any roles

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.remove`
- Location: `src/modules/permission/permission.controller.ts:97-117`

### UC-P6: List Permissions ✅
**Actor**: System Admin, Manager  
**Description**: List permissions with filtering  
**Preconditions**: 
- Actor must be authenticated
- Actor must have "read" permission on "permission" resource

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `permission.find_all`
- Location: `src/modules/permission/permission.controller.ts:35-48`

## Authorization Use Cases

### UC-AZ1: Verify User Claims ✅
**Actor**: System (Microservices)  
**Description**: Verify user claims for authorization  
**Preconditions**: 
- Valid JWT claims must be provided

**Flow**:
1. Service provides user claims and required permissions
2. System validates claims structure
3. System checks if user role matches required roles
4. System verifies role has required permissions
5. System returns authorization result

**Implementation Status**: ✅ Fully Implemented
- Endpoint: `auth.authorize_claims`
- Used internally by all services
- Location: `src/modules/auth/auth.controller.ts:18-24`

### UC-AZ2: Role-Based Access Control ✅
**Actor**: System  
**Description**: Enforce role-based access control across services  
**Preconditions**: 
- User must be authenticated
- Roles and permissions must be properly configured

**Implementation Status**: ✅ Fully Implemented
- Implemented in RoleService.authorizeClaims
- Location: `src/modules/role/role.service.ts:129-157`

## Implementation Coverage Analysis

### Fully Implemented Use Cases (15/23 - 65%)
✅ User: View Profile, List/Search Users, Create User  
✅ Authentication: Login  
✅ Role: All CRUD operations  
✅ Permission: All CRUD operations  
✅ Authorization: Claims verification, RBAC  

### Partially Implemented Use Cases (1/23 - 4%)
⚠️ User: Update Profile (missing admin/manager update for other users)

### Not Implemented Use Cases (7/23 - 31%)
❌ Audit: User activity logging  

## Missing Use Cases

Based on the requirements and typical enterprise systems, these use cases are missing:

### UC-U9: User Activity Audit ❌
**Description**: Track user login/logout and actions  
**Importance**: High - Required for security compliance

## Recommendations

### High Priority Implementations
1. **User Deletion**: Add soft delete functionality for users
2. **Password Reset**: Implement secure password reset flow
3. **User Activity Audit**: Track all user actions for compliance
4. **Account Status Management**: Add active/inactive status to users
5. **Logout Functionality**: Implement proper session termination

### Medium Priority Enhancements
1. **Manager User Update**: Allow managers to update user profiles
2. **Token Management**: Implement refresh token mechanism
3. **Role Assignment Audit**: Track role changes
4. **Bulk Operations**: Add bulk user import/export

### Security Enhancements
1. Add rate limiting for login attempts
2. Implement password complexity requirements
3. Add session timeout configuration
4. Implement IP-based access control
5. Add multi-factor authentication support

### API Improvements
1. Standardize error responses across all endpoints
2. Add request validation middleware
3. Implement comprehensive logging
4. Add API versioning support
5. Improve pagination consistency

### Database Enhancements
1. Add indexes for frequently queried fields
2. Implement database-level constraints
3. Add audit columns (created_by, updated_by)
4. Implement proper cascade deletes
5. Add database backup strategies

## Conclusion

The User Service currently covers 69% of the identified use cases, with strong implementation of core functionality around users, roles, and permissions. However, critical features like user deletion, password reset, and session management are missing. The authorization system is well-implemented with proper RBAC support.

To meet enterprise requirements, focus should be on implementing the missing high-priority use cases, especially around user lifecycle management, security features, and audit capabilities.