# ERP API Gateway - Endpoint Documentation

## Service Overview

**Service Name:** ERP-API-Gateway  
**Version:** 1.0.0  
**Description:** Fastify-based API Gateway that proxies requests to three microservices: Users, Groups, and Tickets. Handles authentication, authorization, and request routing.

### Architecture

- **Type:** API Gateway
- **Framework:** Fastify
- **Authentication:** JWT (via Authorization header or jwt cookie)

### Microservices

| Service | Environment Variable | Responsibilities |
|---------|---------------------|------------------|
| Users Service | `USERS_SERVICE_URL` | User management, Authentication, Permissions |
| Groups Service | `GROUPS_SERVICE_URL` | Group management, Member management |
| Tickets Service | `TICKETS_SERVICE_URL` | Ticket management, Assignment, Status workflow |

### Authentication Flow

1. JWT tokens sent via Authorization: Bearer {token} header OR jwt cookie
2. Gateway validates tokens using app.authenticate() before proxying
3. Permissions checked at gateway level via app.requirePermission()
4. Some endpoints delegate authorization to microservices (e.g., ownership rules)

### Response Standard

All endpoints follow a consistent response structure:

```json
{
  "statusCode": <number>,
  "intOpCode": "<string>",
  "message": "<string>",
  "data": <array>
}
```

**Important:** The `data` field is ALWAYS an array, even for single-object responses.

**OpCode Pattern:** [S|E][SERVICE][ACTION][CODE]

**Examples:**
- `SUSLG200`: Success User Service Login 200
- `EGWAU401`: Error Gateway Authentication Unauthorized 401
- `STKRD200`: Success Ticket Service Read 200

---

## Global Enums

### User Status
- `0`: Inactive
- `1`: Active

### Group Status
- `0`: Inactive
- `1`: Active

### Ticket Status
- `1`: Open
- `2`: InProgress
- `3`: Closed

### Ticket Priority

**Frontend (string values):** Low, Medium, High

**Backend (numeric values):**
- `1`: Low
- `2`: Medium
- `3`: High

> **Note:** Frontend sends priority as string (Low/Medium/High), backend stores as numeric (1/2/3)

---

## Global Permissions

### User Permissions
- `canCreate_Users`
- `canRead_Users`
- `canUpdate_Users`
- `canDelete_Users`

### Group Permissions
- `canCreate_Groups`
- `canRead_Groups`
- `canUpdate_Groups`
- `canDelete_Groups`

### Ticket Permissions
- `canCreate_Tickets`
- `canRead_Tickets`
- `canUpdate_Tickets`
- `canDelete_Tickets`
- `canAssign_Tickets`
- `canUpdateStatus_Tickets`

---

## Endpoint Summary

**Total Endpoints:** 29

| Module | Count |
|--------|-------|
| health | 1 |
| auth | 2 |
| users | 9 |
| groups | 9 |
| tickets | 8 |

### Quick Reference Table

| Method | Endpoint | Summary | Auth Required | Permissions |
|--------|----------|---------|---------------|-------------|
| GET | `/health` | Gateway health check | No | None |
| POST | `/auth/login` | Login | No | None |
| POST | `/auth/logout` | Logout | Yes | None |
| GET | `/users` | Get users | Yes | canRead_Users |
| GET | `/users/me` | Get authenticated user | Yes | None |
| GET | `/users/:userId` | Get user by id | Yes | canRead_Users |
| POST | `/users` | Create user | Yes | canCreate_Users |
| PUT | `/users/:userId` | Update user | Yes | None |
| PUT | `/users/:userId/permissions` | Update user permissions | Yes | canUpdate_Users |
| PATCH | `/users/:userId/password` | Change user password | Yes | None |
| GET | `/users/permissions` | Get all permissions | Yes | canRead_Users |
| DELETE | `/users/:userId/status` | Deactivate user | Yes | canDelete_Users |
| GET | `/groups` | Get groups | Yes | canRead_Groups |
| GET | `/groups/:groupId` | Get group by id | Yes | canRead_Groups |
| GET | `/groups/:groupId/members` | Get group members | Yes | canRead_Groups |
| POST | `/groups` | Create group | Yes | canCreate_Groups |
| POST | `/groups/members` | Add group member | Yes | canUpdate_Groups |
| DELETE | `/groups/members` | Remove group member | Yes | canUpdate_Groups |
| PATCH | `/groups/:groupId` | Edit group | Yes | canUpdate_Groups |
| PATCH | `/groups/:groupId/deactivate` | Deactivate group | Yes | canDelete_Groups |
| GET | `/groups/:groupId/tickets` | Get tickets of a group | Yes | canRead_Groups |
| GET | `/tickets` | Get tickets | Yes | canRead_Tickets |
| GET | `/tickets/pending` | Get pending tickets | Yes | canRead_Tickets |
| GET | `/tickets/:ticketId` | Get ticket by id | Yes | canRead_Tickets |
| POST | `/tickets` | Create ticket | Yes | canCreate_Tickets |
| PATCH | `/tickets/:ticketId` | Edit ticket | Yes | canUpdate_Tickets |
| POST | `/tickets/:ticketId/assign` | Assign ticket | Yes | canAssign_Tickets |
| POST | `/tickets/:ticketId/start-work` | Start work on ticket | Yes | canUpdateStatus_Tickets |
| POST | `/tickets/:ticketId/finish` | Finish ticket | Yes | canUpdateStatus_Tickets |

---

## Detailed Endpoint Documentation


### HEALTH Module

#### GET /health

**ID:** `health-check`  
**Summary:** Gateway health check  
**Description:** Health check endpoint to verify that the API Gateway is running and responding.

**Authentication:**
- Required: No
- Type: none

**Responses:**

- **200** (`SGWHL200`): API Gateway is healthy.
  - When: Always - when gateway is running
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGWHL200",
        "message": "API Gateway is healthy.",
        "data": []
    }
    ```

**Business Rules:**
- Simple health check endpoint
- No proxying to microservices
- Returns 200 OK if gateway is running
- Useful for load balancers and monitoring

---


### AUTH Module

#### POST /auth/login

**ID:** `auth-login`  
**Summary:** Login  
**Description:** Authenticates a user through the Users service.

**Authentication:**
- Required: No
- Type: none

**Request Body:**
```json
{
  "email": "jorge@test.com",
  "password": "password123"
}
```

Required fields: `email`, `password`  

**Responses:**

- **200** (`SUSLG200`): Login successful.
  - When: When credentials are valid and user is authenticated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSLG200",
        "message": "Login successful.",
        "data": [
            {
                "token": "eyJ...",
                "expiresAt": "2026-04-20T18:00:00.000Z",
                "permissions": [
                    "canRead_Users",
                    "canRead_Groups",
                    "canRead_Tickets"
                ]
            }
        ]
    }
    ```
- **401** (`EUSAU401`): Invalid credentials.
  - When: When email or password is incorrect
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EUSAU401",
        "message": "Invalid credentials.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies request to Users microservice at /api/User/login
- Returns JWT token with expiration date and user permissions
- Token should be stored by frontend for subsequent authenticated requests
- Permissions array indicates what actions the user can perform

**Proxies to:** /api/User/login

---

#### POST /auth/logout

**ID:** `auth-logout`  
**Summary:** Logout  
**Description:** Logs out the current authenticated user.

**Authentication:**
- Required: Yes
- Type: bearer

**Responses:**

- **200** (`SUSLO200`): Logout successful.
  - When: When user is authenticated and logout is processed successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSLO200",
        "message": "Logout successful.",
        "data": []
    }
    ```
- **401** (`EGWAU401`): Missing authentication token.
  - When: When no token is provided in Authorization header or jwt cookie
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Missing authentication token.",
        "data": []
    }
    ```
- **401** (`EGWAU401`): Invalid authentication token.
  - When: When token is malformed, expired, or signature verification fails
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Invalid authentication token.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies request to Users microservice at /api/User/logout
- Token validation happens in gateway before proxying
- Actual logout logic (token invalidation) happens in Users microservice
- Frontend should clear stored token after successful logout

**Proxies to:** /api/User/logout

---


### USERS Module

#### GET /users

**ID:** `users-get-all`  
**Summary:** Get users  
**Description:** Retrieves the list of users.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Users`

**Responses:**

- **200** (`SUSRD200`): Users retrieved successfully.
  - When: When user is authenticated and has canRead_Users permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSRD200",
        "message": "Users retrieved successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "userName": "admin",
                "firstName": "Jorge",
                "middleName": "Luis",
                "lastName": "Pérez",
                "email": "jorge@test.com",
                "permissions": [
                    "canRead_Users",
                    "canRead_Groups",
                    "canRead_Tickets"
                ]
            }
        ]
    }
    ```
- **401** (`EGWAU401`): Missing authentication token.
  - When: When no token is provided
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Missing authentication token.",
        "data": []
    }
    ```
- **403** (`EGWFB403`): You do not have permission to perform this action.
  - When: When user is authenticated but doesn't have canRead_Users permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGWFB403",
        "message": "You do not have permission to perform this action.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/GetUsers
- Returns all users in the system
- Each user includes their permissions array
- middleName can be null

**Proxies to:** /api/User/GetUsers

---

#### GET /users/me

**ID:** `users-get-me`  
**Summary:** Get authenticated user  
**Description:** Retrieves the currently authenticated user.

**Authentication:**
- Required: Yes
- Type: bearer

**Responses:**

- **200** (`SUSME200`): Authenticated user retrieved successfully.
  - When: When user is authenticated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSME200",
        "message": "Authenticated user retrieved successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "userName": "admin",
                "firstName": "Jorge",
                "middleName": "Luis",
                "lastName": "Pérez",
                "email": "jorge@test.com"
            }
        ]
    }
    ```
- **401** (`EGWAU401`): Invalid authentication token.
  - When: When token is invalid, expired, or malformed
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Invalid authentication token.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/Me
- Returns authenticated user's data based on JWT userId claim
- Does not return permissions array (unlike get-all endpoint)
- Useful for profile display

**Proxies to:** /api/User/Me

---

#### GET /users/:userId

**ID:** `users-get-by-id`  
**Summary:** Get user by id  
**Description:** Retrieves a specific user by id.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Users`

**Route Parameters:**
- `userId` (string, required): User ID (UUID format)

**Responses:**

- **200** (`SUSRD200`): User retrieved successfully.
  - When: When user exists and requester has canRead_Users permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSRD200",
        "message": "User retrieved successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000001",
                "userName": "admin",
                "firstName": "Jorge",
                "middleName": "Luis",
                "lastName": "Pérez",
                "email": "jorge@test.com",
                "permissions": [
                    "canRead_Users",
                    "canRead_Groups",
                    "canRead_Tickets"
                ]
            }
        ]
    }
    ```
- **404** (`EUSNF404`): User not found.
  - When: When userId doesn't exist in database
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EUSNF404",
        "message": "User not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/GetUserById/{userId}
- Returns specific user with permissions array
- Useful for user detail view

**Proxies to:** /api/User/GetUserById/{userId}

---

#### POST /users

**ID:** `users-create`  
**Summary:** Create user  
**Description:** Creates a new user.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canCreate_Users`

**Request Body:**
```json
{
  "userName": "jdoe",
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "email": "john.doe@test.com",
  "password": "SecurePass123"
}
```

Required fields: `userName`, `firstName`, `lastName`, `email`, `password`  
Optional fields: `middleName`  

**Responses:**

- **201** (`SUSCR201`): User created successfully.
  - When: When user is created successfully
  - Example:
    ```json
    {
        "statusCode": 201,
        "intOpCode": "SUSCR201",
        "message": "User created successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000010"
            }
        ]
    }
    ```
- **400** (`EUSBR400`): Invalid request payload.
  - When: When required fields are missing or data format is invalid
  - Example:
    ```json
    {
        "statusCode": 400,
        "intOpCode": "EUSBR400",
        "message": "Invalid request payload.",
        "data": []
    }
    ```
- **409** (`EUSCF409`): A user with the same email already exists.
  - When: When email is already registered in system
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EUSCF409",
        "message": "A user with the same email already exists.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/CreateUser
- Email must be unique
- Returns new user's ID
- middleName is optional
- Password validation rules enforced by microservice

**Proxies to:** /api/User/CreateUser

---

#### PUT /users/:userId

**ID:** `users-update`  
**Summary:** Update user  
**Description:** Updates a user. This operation is available to privileged users or to the same authenticated user depending on backend rules.

**Authentication:**
- Required: Yes
- Type: bearer

**Route Parameters:**
- `userId` (string, required): User ID to update (UUID format)

**Request Body:**
```json
{
  "userName": "jdoe_updated",
  "firstName": "John",
  "middleName": "Michael",
  "lastName": "Doe",
  "email": "john.updated@test.com"
}
```

Optional fields: `userName`, `firstName`, `middleName`, `lastName`, `email`  

**Responses:**

- **200** (`SUSUP200`): User updated successfully.
  - When: When user is updated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSUP200",
        "message": "User updated successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000001"
            }
        ]
    }
    ```
- **403** (`EUSFB403`): You are not authorized to update this user.
  - When: When user tries to update another user without permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EUSFB403",
        "message": "You are not authorized to update this user.",
        "data": []
    }
    ```
- **404** (`EUSNF404`): User not found.
  - When: When userId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EUSNF404",
        "message": "User not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/UpdateUser/{userId}
- Authorization rules enforced by microservice
- User can update own profile
- Privileged users can update any user (inferred from description)
- Returns updated user's ID

**Proxies to:** /api/User/UpdateUser/{userId}

---

#### PUT /users/:userId/permissions

**ID:** `users-update-permissions`  
**Summary:** Update user permissions  
**Description:** Updates the permissions of a specific user.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdate_Users`

**Route Parameters:**
- `userId` (string, required): User ID to update permissions (UUID format)

**Request Body:**
```json
{
  "permissionIds": [
    "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
    "019d5a1b-cee1-7e2d-b1b0-79a8c75197e4"
  ]
}
```

Optional fields: `permissionIds`  

**Responses:**

- **200** (`SUSPM200`): User permissions updated successfully.
  - When: When permissions are updated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSPM200",
        "message": "User permissions updated successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000001"
            }
        ]
    }
    ```
- **404** (`EUSNF404`): User not found.
  - When: When userId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EUSNF404",
        "message": "User not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/UpdateUserPermissions/{userId}
- Requires canUpdate_Users permission
- Replaces user's permissions with provided array
- Get available permissions from /users/permissions endpoint first

**Proxies to:** /api/User/UpdateUserPermissions/{userId}

---

#### PATCH /users/:userId/password

**ID:** `users-change-password`  
**Summary:** Change user password  
**Description:** Changes the password of a user. This operation is available to privileged users or to the same authenticated user depending on backend rules.

**Authentication:**
- Required: Yes
- Type: bearer

**Route Parameters:**
- `userId` (string, required): User ID (UUID format)

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

Required fields: `newPassword`  
Optional fields: `currentPassword`  

**Responses:**

- **200** (`SUSPW200`): Password updated successfully.
  - When: When password is changed successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSPW200",
        "message": "Password updated successfully.",
        "data": []
    }
    ```
- **403** (`EUSFB403`): You are not authorized to update this password.
  - When: When user tries to change another user's password without permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EUSFB403",
        "message": "You are not authorized to update this password.",
        "data": []
    }
    ```
- **404** (`EUSNF404`): User not found.
  - When: When userId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EUSNF404",
        "message": "User not found.",
        "data": []
    }
    ```
- **409** (`EUSCF409`): Current password is invalid.
  - When: When currentPassword doesn't match user's actual current password
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EUSCF409",
        "message": "Current password is invalid.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/ChangePassword/{userId}
- User changing own password must provide currentPassword
- Admin/privileged users may change password without currentPassword (inferred)
- Validates currentPassword before allowing change
- Does not return any data, only status

**Proxies to:** /api/User/ChangePassword/{userId}

---

#### GET /users/permissions

**ID:** `users-get-permissions`  
**Summary:** Get all permissions  
**Description:** Retrieves the full list of available permissions.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Users`

**Responses:**

- **200** (`SUSRP200`): Permissions retrieved successfully.
  - When: When permissions are retrieved successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSRP200",
        "message": "Permissions retrieved successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "name": "canRead_Users"
            }
        ]
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/permissions
- Returns all available permissions in system
- Used for permission assignment UI

**Proxies to:** /api/User/permissions

---

#### DELETE /users/:userId/status

**ID:** `users-update-status`  
**Summary:** Deactivate user  
**Description:** Updates the status of a user, typically used for deactivation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canDelete_Users`

**Route Parameters:**
- `userId` (string, required): User ID to deactivate (UUID format)

**Request Body:**
```json
{
  "status": 0
}
```

Required fields: `status`  

**Responses:**

- **200** (`SUSDU200`): User deactivated successfully.
  - When: When user status is updated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SUSDU200",
        "message": "User deactivated successfully.",
        "data": []
    }
    ```
- **404** (`EUSNF404`): User not found.
  - When: When userId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EUSNF404",
        "message": "User not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Users microservice at /api/User/{userId}/status
- Logical deletion - user not physically deleted
- Status field controls active/inactive state
- Requires canDelete_Users permission

**Proxies to:** /api/User/{userId}/status

---


### GROUPS Module

#### GET /groups

**ID:** `groups-get-all`  
**Summary:** Get groups  
**Description:** Retrieves the list of groups.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Groups`

**Responses:**

- **200** (`SGRRD200`): Groups retrieved successfully.
  - When: When user is authenticated and has canRead_Groups permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRRD200",
        "message": "Groups retrieved successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "name": "Soporte",
                "description": "Grupo de soporte técnico",
                "owner": "Juan Pérez",
                "status": 1
            }
        ]
    }
    ```
- **401** (`EGWAU401`): Missing authentication token.
  - When: When no token is provided
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Missing authentication token.",
        "data": []
    }
    ```
- **403** (`EGWFB403`): You do not have permission to perform this action.
  - When: When user doesn't have canRead_Groups permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGWFB403",
        "message": "You do not have permission to perform this action.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/GetGroups
- Returns all groups in system
- status field: 1=active, 0=inactive (inferred)
- owner field shows owner's full name

**Proxies to:** /api/Group/GetGroups

---

#### GET /groups/:groupId

**ID:** `groups-get-by-id`  
**Summary:** Get group by id  
**Description:** Retrieves the detail of a specific group by its id.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Groups`

**Route Parameters:**
- `groupId` (string, required): Group ID (UUID format)

**Responses:**

- **200** (`SGRRD200`): Group retrieved successfully.
  - When: When group exists and user has permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRRD200",
        "message": "Group retrieved successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "name": "Soporte",
                "description": "Grupo de soporte técnico",
                "createdByUserId": "00000000-0000-0000-0000-000000000001",
                "owner": "Juan Pérez",
                "status": 1,
                "members": [
                    {
                        "id": "00000000-0000-0000-0000-000000000003",
                        "userName": "mlopez",
                        "completeName": "María López"
                    }
                ]
            }
        ]
    }
    ```
- **404** (`EGRNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/GetGroupById/{groupId}
- Returns detailed group info including members list
- Includes createdByUserId for ownership validation
- members array contains user id, userName, and completeName

**Proxies to:** /api/Group/GetGroupById/{groupId}

---

#### GET /groups/:groupId/members

**ID:** `groups-get-members`  
**Summary:** Get group members  
**Description:** Retrieves the list of members of a specific group.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Groups`

**Route Parameters:**
- `groupId` (string, required): Group ID (UUID format)

**Responses:**

- **200** (`SGRRD200`): Group members retrieved successfully.
  - When: When group exists and user has permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRRD200",
        "message": "Group members retrieved successfully.",
        "data": [
            {
                "id": "00000000-0000-0000-0000-000000000003",
                "userName": "mlopez",
                "completeName": "María López"
            }
        ]
    }
    ```
- **404** (`EGRNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/GetGroupMembers/{groupId}
- Returns only members list without group details
- Alternative to getting full group with /groups/:groupId

**Proxies to:** /api/Group/GetGroupMembers/{groupId}

---

#### POST /groups

**ID:** `groups-create`  
**Summary:** Create group  
**Description:** Creates a new group.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canCreate_Groups`

**Request Body:**
```json
{
  "name": "Desarrollo",
  "description": "Equipo de desarrollo de software"
}
```

Required fields: `name`, `description`  

**Responses:**

- **201** (`SGRCR201`): Group created successfully.
  - When: When group is created successfully
  - Example:
    ```json
    {
        "statusCode": 201,
        "intOpCode": "SGRCR201",
        "message": "Group created successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
            }
        ]
    }
    ```
- **400** (`EGRBR400`): Invalid request payload.
  - When: When required fields are missing or invalid
  - Example:
    ```json
    {
        "statusCode": 400,
        "intOpCode": "EGRBR400",
        "message": "Invalid request payload.",
        "data": []
    }
    ```
- **409** (`EGRCF409`): A group with the same name already exists.
  - When: When group name already exists
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EGRCF409",
        "message": "A group with the same name already exists.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/AddGroup
- Group name must be unique
- Authenticated user becomes owner
- Group starts with active status (inferred)
- Returns new group ID

**Proxies to:** /api/Group/AddGroup

---

#### POST /groups/members

**ID:** `groups-add-member`  
**Summary:** Add group member  
**Description:** Adds a user as member of a group. Only the group owner can perform this operation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdate_Groups`

**Request Body:**
```json
{
  "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
  "memberId": "00000000-0000-0000-0000-000000000005"
}
```

Required fields: `groupId`, `memberId`  

**Responses:**

- **200** (`SGRMB200`): Group member added successfully.
  - When: When member is added successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRMB200",
        "message": "Group member added successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
            }
        ]
    }
    ```
- **403** (`EGRFB403`): Only the group owner can add members.
  - When: When non-owner tries to add member
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGRFB403",
        "message": "Only the group owner can add members.",
        "data": []
    }
    ```
- **404** (`EGRNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```
- **409** (`EGRCF409`): The specified group was not found or is inactive.
  - When: When group is inactive
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EGRCF409",
        "message": "The specified group was not found or is inactive.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/AddMember
- Only group owner can add members
- Group must be active (status=1)
- User must exist and be active
- Cannot add duplicate members (inferred)
- Returns group ID

**Proxies to:** /api/Group/AddMember

---

#### DELETE /groups/members

**ID:** `groups-remove-member`  
**Summary:** Remove group member  
**Description:** Removes a user from a group. Only the group owner can perform this operation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdate_Groups`

**Request Body:**
```json
{
  "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
  "memberId": "00000000-0000-0000-0000-000000000005"
}
```

Required fields: `groupId`, `memberId`  

**Responses:**

- **200** (`SGRMB200`): Group member removed successfully.
  - When: When member is removed successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRMB200",
        "message": "Group member removed successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
            }
        ]
    }
    ```
- **403** (`EGRFB403`): Only the group owner can remove members.
  - When: When non-owner tries to remove member
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGRFB403",
        "message": "Only the group owner can remove members.",
        "data": []
    }
    ```
- **404** (`EGRNF404`): The specified member was not found in the group.
  - When: When memberId is not in the group
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified member was not found in the group.",
        "data": []
    }
    ```
- **409** (`EGRCF409`): The specified group was not found or is inactive.
  - When: When group is inactive
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EGRCF409",
        "message": "The specified group was not found or is inactive.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/RemoveMember
- Only group owner can remove members
- Group must be active (status=1)
- Member must exist in group
- Returns group ID

**Proxies to:** /api/Group/RemoveMember

---

#### PATCH /groups/:groupId

**ID:** `groups-update`  
**Summary:** Edit group  
**Description:** Updates the data of a group. Only the group owner can perform this operation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdate_Groups`

**Route Parameters:**
- `groupId` (string, required): Group ID to update (UUID)

**Request Body:**
```json
{
  "name": "Soporte Técnico",
  "description": "Equipo de soporte técnico actualizado"
}
```

Optional fields: `name`, `description`  

**Responses:**

- **200** (`SGRUP200`): Group updated successfully.
  - When: When group is updated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRUP200",
        "message": "Group updated successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
            }
        ]
    }
    ```
- **403** (`EGRFB403`): Only the group owner can edit the group.
  - When: When non-owner tries to edit
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGRFB403",
        "message": "Only the group owner can edit the group.",
        "data": []
    }
    ```
- **404** (`EGRNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```
- **409** (`EGRCF409`): The specified group is inactive.
  - When: When group status is inactive
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EGRCF409",
        "message": "The specified group is inactive.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/EditGroup/{groupId}
- Only owner can edit
- Group must be active
- Name must remain unique if changed
- Returns group ID

**Proxies to:** /api/Group/EditGroup/{groupId}

---

#### PATCH /groups/:groupId/deactivate

**ID:** `groups-deactivate`  
**Summary:** Deactivate group  
**Description:** Performs a logical deactivation of a group. The owner or superadmin can perform this operation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canDelete_Groups`

**Route Parameters:**
- `groupId` (string, required): Group ID to deactivate (UUID)

**Responses:**

- **200** (`SGRDL200`): Group deactivated successfully.
  - When: When group is deactivated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "SGRDL200",
        "message": "Group deactivated successfully.",
        "data": [
            {
                "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
            }
        ]
    }
    ```
- **403** (`EGRFB403`): Only the group owner or superadmin can deactivate the group.
  - When: When non-owner/non-admin tries to deactivate
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGRFB403",
        "message": "Only the group owner or superadmin can deactivate the group.",
        "data": []
    }
    ```
- **404** (`EGRNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "EGRNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```
- **409** (`EGRCF409`): The group is already inactive.
  - When: When group is already inactive
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "EGRCF409",
        "message": "The group is already inactive.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Groups microservice at /api/Group/{groupId}/deactivate
- Logical deletion (soft delete)
- Owner or superadmin can deactivate
- Cannot deactivate already inactive group
- Sets group status to 0 (inactive)

**Proxies to:** /api/Group/{groupId}/deactivate

---

#### GET /groups/:groupId/tickets

**ID:** `groups-get-tickets`  
**Summary:** Get tickets of a group  
**Description:** Retrieves all tickets that belong to a specific group.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Groups`

**Route Parameters:**
- `groupId` (string, required): Group ID (UUID)

**Responses:**

- **200** (`STKRD200`): Group tickets retrieved successfully.
  - When: When tickets are retrieved successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKRD200",
        "message": "Group tickets retrieved successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980",
                "title": "Error al guardar solicitud",
                "description": "Aparece error 500 al guardar.",
                "status": 1,
                "priority": 3,
                "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "groupName": "Soporte"
            }
        ]
    }
    ```
- **404** (`ETKNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/group/{groupId}
- Returns all tickets for specified group
- Includes basic ticket info
- status: 1=Open, 2=InProgress, 3=Closed (inferred)
- priority: 1=Low, 2=Medium, 3=High (inferred)

**Proxies to:** /tickets/group/{groupId}

---


### TICKETS Module

#### GET /tickets

**ID:** `tickets-get-all`  
**Summary:** Get tickets  
**Description:** Retrieves the list of all tickets, including assigned and unassigned tickets.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Tickets`

**Responses:**

- **200** (`STKRD200`): Tickets retrieved successfully.
  - When: When user is authenticated and has canRead_Tickets permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKRD200",
        "message": "Tickets retrieved successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980",
                "title": "Error al guardar solicitud",
                "description": "Aparece error 500 al guardar.",
                "comments": "Reportado por compras.",
                "status": 1,
                "priority": 3,
                "createdAt": "2026-04-06T12:00:00.000Z",
                "updatedAt": "2026-04-06T12:30:00.000Z",
                "dueDate": "2026-04-20T18:00:00.000Z",
                "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "groupName": "Soporte",
                "createdByUserId": "00000000-0000-0000-0000-000000000002",
                "createdByUserName": "Juan Pérez",
                "assignedUserId": "00000000-0000-0000-0000-000000000003",
                "assignedUserName": "María López"
            }
        ]
    }
    ```
- **401** (`EGWAU401`): Missing authentication token.
  - When: When no token is provided
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Missing authentication token.",
        "data": []
    }
    ```
- **403** (`EGWFB403`): You do not have permission to perform this action.
  - When: When user doesn't have canRead_Tickets permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGWFB403",
        "message": "You do not have permission to perform this action.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets
- Returns all tickets (assigned and unassigned)
- Includes creator and assigned user info
- status: 1=Open, 2=InProgress, 3=Closed (inferred)
- priority: 1=Low, 2=Medium, 3=High (from schema enum)
- comments and dueDate are optional (can be null)
- assignedUserId and assignedUserName are null for unassigned tickets

**Proxies to:** /tickets

---

#### GET /tickets/pending

**ID:** `tickets-get-pending`  
**Summary:** Get pending tickets  
**Description:** Retrieves open and unassigned tickets. Regular users only see pending tickets of groups they own. Superadmin can see all pending tickets.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Tickets`

**Responses:**

- **200** (`STKRD200`): Pending tickets retrieved successfully.
  - When: When user is authenticated and has canRead_Tickets permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKRD200",
        "message": "Pending tickets retrieved successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980",
                "title": "Error al guardar solicitud",
                "description": "Aparece error 500 al guardar.",
                "comments": "Reportado por compras.",
                "status": 1,
                "priority": 3,
                "createdAt": "2026-04-06T12:00:00.000Z",
                "updatedAt": "2026-04-06T12:30:00.000Z",
                "dueDate": "2026-04-20T18:00:00.000Z",
                "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "groupName": "Soporte",
                "createdByUserId": "00000000-0000-0000-0000-000000000002",
                "createdByUserName": "Juan Pérez",
                "assignedUserId": null,
                "assignedUserName": null
            }
        ]
    }
    ```
- **401** (`EGWAU401`): Missing authentication token.
  - When: When no token is provided
  - Example:
    ```json
    {
        "statusCode": 401,
        "intOpCode": "EGWAU401",
        "message": "Missing authentication token.",
        "data": []
    }
    ```
- **403** (`EGWFB403`): You do not have permission to perform this action.
  - When: When user doesn't have canRead_Tickets permission
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "EGWFB403",
        "message": "You do not have permission to perform this action.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/pending
- Returns only open (status=1) and unassigned tickets
- Regular users: filtered to groups they own
- Superadmin: sees all pending tickets
- assignedUserId and assignedUserName are always null
- Useful for ticket assignment workflow

**Proxies to:** /tickets/pending

---

#### GET /tickets/:ticketId

**ID:** `tickets-get-by-id`  
**Summary:** Get ticket by id  
**Description:** Retrieves the detail of a single ticket by its id.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canRead_Tickets`

**Route Parameters:**
- `ticketId` (string, required): Ticket ID (UUID)

**Responses:**

- **200** (`STKRD200`): Ticket retrieved successfully.
  - When: When ticket exists and user has permission
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKRD200",
        "message": "Ticket retrieved successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980",
                "title": "Error al guardar solicitud",
                "description": "Aparece error 500 al guardar.",
                "comments": "Reportado por compras.",
                "status": 1,
                "priority": 3,
                "createdAt": "2026-04-06T12:00:00.000Z",
                "updatedAt": "2026-04-06T12:30:00.000Z",
                "dueDate": "2026-04-20T18:00:00.000Z",
                "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",
                "groupName": "Soporte",
                "createdByUserId": "00000000-0000-0000-0000-000000000002",
                "createdByUserName": "Juan Pérez",
                "assignedUserId": "00000000-0000-0000-0000-000000000003",
                "assignedUserName": "María López"
            }
        ]
    }
    ```
- **404** (`ETKNF404`): The specified ticket was not found.
  - When: When ticketId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified ticket was not found.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/{ticketId}
- Returns complete ticket details
- Includes creator and assigned user info
- Includes timestamps for tracking

**Proxies to:** /tickets/{ticketId}

---

#### POST /tickets

**ID:** `tickets-create`  
**Summary:** Create ticket  
**Description:** Creates a new ticket.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canCreate_Tickets`

**Request Body:**
```json
{
  "title": "Sistema lento",
  "description": "El sistema está muy lento desde esta mañana",
  "comments": "Reportado por 3 usuarios",
  "priority": "High",
  "dueDate": "2026-04-15T18:00:00.000Z",
  "groupId": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3"
}
```

Required fields: `title`, `description`, `priority`, `groupId`  
Optional fields: `comments`, `dueDate`  

**Responses:**

- **201** (`STKCR201`): Ticket created successfully.
  - When: When ticket is created successfully
  - Example:
    ```json
    {
        "statusCode": 201,
        "intOpCode": "STKCR201",
        "message": "Ticket created successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980"
            }
        ]
    }
    ```
- **404** (`ETKNF404`): The specified group was not found.
  - When: When groupId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified group was not found.",
        "data": []
    }
    ```
- **409** (`ETKCF409`): The specified group is inactive.
  - When: When group exists but is inactive
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "ETKCF409",
        "message": "The specified group is inactive.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets
- Ticket created with status=Open (1)
- Ticket is unassigned initially (assignedUserId=null)
- Group must exist and be active
- createdByUserId set from JWT token
- Returns new ticket ID
- priority string converted to numeric in microservice

**Proxies to:** /tickets

---

#### PATCH /tickets/:ticketId

**ID:** `tickets-update`  
**Summary:** Edit ticket  
**Description:** Updates editable fields of an open ticket. Only the creator or superadmin can perform this operation.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdate_Tickets`

**Route Parameters:**
- `ticketId` (string, required): Ticket ID to update (UUID)

**Request Body:**
```json
{
  "title": "Sistema muy lento - Actualizado",
  "description": "El sistema está muy lento desde esta mañana. Afecta a todos los módulos.",
  "comments": "Reportado por 5 usuarios ahora",
  "priority": "High",
  "dueDate": "2026-04-10T18:00:00.000Z"
}
```

Optional fields: `title`, `description`, `comments`, `priority`, `dueDate`  

**Responses:**

- **200** (`STKUP200`): Ticket updated successfully.
  - When: When ticket is updated successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKUP200",
        "message": "Ticket updated successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980"
            }
        ]
    }
    ```
- **403** (`ETKFB403`): You are not authorized to edit this ticket.
  - When: When non-creator/non-admin tries to edit
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "ETKFB403",
        "message": "You are not authorized to edit this ticket.",
        "data": []
    }
    ```
- **404** (`ETKNF404`): The specified ticket was not found.
  - When: When ticketId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified ticket was not found.",
        "data": []
    }
    ```
- **409** (`ETKCF409`): The ticket cannot be edited because it is not open.
  - When: When ticket status is not Open (InProgress or Closed)
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "ETKCF409",
        "message": "The ticket cannot be edited because it is not open.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/{ticketId}
- Only creator or superadmin can edit
- Ticket must be Open (status=1)
- Cannot edit InProgress or Closed tickets
- Does not change status, assignee, or group
- Returns ticket ID

**Proxies to:** /tickets/{ticketId}

---

#### POST /tickets/:ticketId/assign

**ID:** `tickets-assign`  
**Summary:** Assign ticket  
**Description:** Assigns an open ticket to an active user that belongs to the ticket group. Only the group owner or superadmin can assign.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canAssign_Tickets`

**Route Parameters:**
- `ticketId` (string, required): Ticket ID to assign (UUID)

**Request Body:**
```json
{
  "assignedUserId": "00000000-0000-0000-0000-000000000003"
}
```

Required fields: `assignedUserId`  

**Responses:**

- **200** (`STKAS200`): Ticket assigned successfully.
  - When: When ticket is assigned successfully
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKAS200",
        "message": "Ticket assigned successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980"
            }
        ]
    }
    ```
- **403** (`ETKFB403`): You are not authorized to assign this ticket.
  - When: When non-owner/non-admin tries to assign
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "ETKFB403",
        "message": "You are not authorized to assign this ticket.",
        "data": []
    }
    ```
- **404** (`ETKNF404`): The specified ticket was not found.
  - When: When ticketId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified ticket was not found.",
        "data": []
    }
    ```
- **409** (`ETKCF409`): The ticket is already assigned.
  - When: When ticket already has an assignedUserId
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "ETKCF409",
        "message": "The ticket is already assigned.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/{ticketId}/assign
- Only group owner or superadmin can assign
- Ticket must be Open and Unassigned
- User must be active group member
- Sets assignedUserId field
- Ticket remains in Open status
- Returns ticket ID

**Proxies to:** /tickets/{ticketId}/assign

---

#### POST /tickets/:ticketId/start-work

**ID:** `tickets-start-work`  
**Summary:** Start work on ticket  
**Description:** Changes the status of the assigned ticket from Open to InProgress. Only the assigned user can do this.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdateStatus_Tickets`

**Route Parameters:**
- `ticketId` (string, required): Ticket ID (UUID)

**Responses:**

- **200** (`STKSW200`): Work started successfully.
  - When: When status changes from Open to InProgress
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKSW200",
        "message": "Work started successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980"
            }
        ]
    }
    ```
- **403** (`ETKFB403`): You are not authorized to start work on this ticket.
  - When: When user is not the assignee
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "ETKFB403",
        "message": "You are not authorized to start work on this ticket.",
        "data": []
    }
    ```
- **404** (`ETKNF404`): The specified ticket was not found.
  - When: When ticketId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified ticket was not found.",
        "data": []
    }
    ```
- **409** (`ETKCF409`): The ticket cannot start work because it is not open.
  - When: When ticket is not in Open status
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "ETKCF409",
        "message": "The ticket cannot start work because it is not open.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/{ticketId}/start-work
- Changes status from Open (1) to InProgress (2)
- Only assigned user can start work
- Ticket must be Open and Assigned
- Updates updatedAt timestamp
- Returns ticket ID

**Proxies to:** /tickets/{ticketId}/start-work

---

#### POST /tickets/:ticketId/finish

**ID:** `tickets-finish`  
**Summary:** Finish ticket  
**Description:** Changes the status of the assigned ticket from InProgress to Closed. Only the assigned user can do this.

**Authentication:**
- Required: Yes
- Type: bearer
- Permissions: `canUpdateStatus_Tickets`

**Route Parameters:**
- `ticketId` (string, required): Ticket ID (UUID)

**Responses:**

- **200** (`STKFN200`): Ticket finished successfully.
  - When: When status changes from InProgress to Closed
  - Example:
    ```json
    {
        "statusCode": 200,
        "intOpCode": "STKFN200",
        "message": "Ticket finished successfully.",
        "data": [
            {
                "id": "f92b1d7d-7ed1-4f63-8d55-671d9f2b7980"
            }
        ]
    }
    ```
- **403** (`ETKFB403`): You are not authorized to finish this ticket.
  - When: When user is not the assignee
  - Example:
    ```json
    {
        "statusCode": 403,
        "intOpCode": "ETKFB403",
        "message": "You are not authorized to finish this ticket.",
        "data": []
    }
    ```
- **404** (`ETKNF404`): The specified ticket was not found.
  - When: When ticketId doesn't exist
  - Example:
    ```json
    {
        "statusCode": 404,
        "intOpCode": "ETKNF404",
        "message": "The specified ticket was not found.",
        "data": []
    }
    ```
- **409** (`ETKCF409`): The ticket cannot be finished because it is not in progress.
  - When: When ticket is not in InProgress status
  - Example:
    ```json
    {
        "statusCode": 409,
        "intOpCode": "ETKCF409",
        "message": "The ticket cannot be finished because it is not in progress.",
        "data": []
    }
    ```

**Business Rules:**
- Proxies to Tickets microservice at /tickets/{ticketId}/finish
- Changes status from InProgress (2) to Closed (3)
- Only assigned user can finish
- Ticket must be InProgress
- Updates updatedAt timestamp
- Closed tickets cannot be edited
- Returns ticket ID

**Proxies to:** /tickets/{ticketId}/finish

---


## Frontend Route Mapping Hints

Suggested mapping of endpoints to frontend pages:

### loginPage
- /auth/login

### dashboardPage
- /health
- /users/me
- /tickets
- /groups

### usersManagementPage
- /users
- /users/:userId
- /users/permissions
- /users/:userId/permissions

### groupsManagementPage
- /groups
- /groups/:groupId
- /groups/:groupId/members
- /groups/members

### ticketsManagementPage
- /tickets
- /tickets/:ticketId
- /tickets/pending

### myProfilePage
- /users/me
- /users/:userId/password

### ticketAssignmentPage
- /tickets/pending
- /tickets/:ticketId/assign

### myTicketsPage
- /tickets (filter by assignedUserId)
- /tickets/:ticketId/start-work
- /tickets/:ticketId/finish


## Detected Inconsistencies

### 1. Priority value format inconsistency

**Description:** Frontend sends priority as string ('Low', 'Medium', 'High') but backend likely stores as numeric (1, 2, 3). Gateway schema shows enum as strings.

**Affected Endpoints:**
- /tickets (POST)
- /tickets/:ticketId (PATCH)

**Recommendation:** Clarify with backend team if conversion happens in microservice or if both formats are accepted

---

### 2. Status field meaning varies by context

**Description:** User status and Group status both use 0/1 (Inactive/Active), but Ticket status uses 1/2/3 (Open/InProgress/Closed). May cause confusion.

**Affected Endpoints:**
- User endpoints
- Group endpoints
- Ticket endpoints

**Recommendation:** Consider using consistent status naming across entities or documenting clearly

---

### 3. DELETE method with request body

**Description:** The /users/:userId/status endpoint uses DELETE method but requires a request body with status field. This is unusual as DELETE typically has no body.

**Affected Endpoints:**
- /users/:userId/status (DELETE)

**Recommendation:** Consider using PATCH method instead, or make status a query parameter

---

### 4. Shared OpCode for different operations

**Description:** Groups add member and remove member both return SGRMB200, making it harder to distinguish operations in logs.

**Affected Endpoints:**
- /groups/members (POST)
- /groups/members (DELETE)

**Recommendation:** Consider using distinct OpCodes like SGRAM200 (add) and SGRRM200 (remove)

---

### 5. Comments field purpose unclear

**Description:** Tickets have both 'description' and 'comments' fields. The distinction and use case for each is not clearly documented.

**Affected Endpoints:**
- Ticket endpoints

**Recommendation:** Clarify: description = initial problem statement, comments = additional notes/updates?

---

