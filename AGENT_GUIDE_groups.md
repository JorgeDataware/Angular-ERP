# AGENT_GUIDE_groups.md — FASE 3: Groups Module

## Overview

The Groups module was migrated from 100% in-memory/hardcoded data to consume the API Gateway exclusively. The module covers group CRUD (create, edit, deactivate) and group member management (add/remove members). All operations go through the gateway at `{apiGatewayUrl}/groups`.

## Backend Endpoints Wired (8 total)

| Method   | Endpoint                         | Permission         | Description                         |
|----------|----------------------------------|--------------------|-------------------------------------|
| GET      | `/groups`                        | `canRead_Groups`   | List all groups                     |
| GET      | `/groups/:groupId`               | `canRead_Groups`   | Group detail (includes members)     |
| GET      | `/groups/:groupId/members`       | `canRead_Groups`   | Group members only                  |
| GET      | `/groups/:groupId/tickets`       | `canRead_Groups`   | Group tickets                       |
| POST     | `/groups`                        | `canCreate_Groups` | Create group (name, description)    |
| PATCH    | `/groups/:groupId`               | `canUpdate_Groups` | Edit group (name?, description?)    |
| PATCH    | `/groups/:groupId/deactivate`    | `canDelete_Groups` | Deactivate group (no body)          |
| POST     | `/groups/members`                | `canUpdate_Groups` | Add member (groupId, memberId)      |
| DELETE   | `/groups/members`                | `canUpdate_Groups` | Remove member (groupId, memberId)   |

## Key Model Differences (Frontend vs Backend)

### Group List (GET /groups)
- **Backend**: `{ id(UUID), name, description, owner(string), status(1/0) }`
- **Old frontend**: `{ id(number), nivel, autor, nombre, integrantes(count), tickets(count), descripcion }`
- Backend has NO `nivel`, `integrantes` (count), or `tickets` (count) fields
- `owner` is auto-set from JWT on create, not editable
- `status` is 1=active, 0=inactive

### Group Detail (GET /groups/:groupId)
- Extends list shape with: `createdByUserId`, `members[{id, userName, completeName}]`

### Group Members (GET /groups/:groupId/members)
- Shape: `{ id(UUID), userName, completeName }` — lightweight, NOT full UserBackend

### Create/Edit
- **Create**: `POST /groups` with `{ name, description }` only
- **Edit**: `PATCH /groups/:groupId` with `{ name?, description? }` — only owner can edit
- **Deactivate**: `PATCH /groups/:groupId/deactivate` — no body, only owner/superadmin

### Member Management
- **Add**: `POST /groups/members` with `{ groupId, memberId }` — owner only
- **Remove**: `DELETE /groups/members` with `{ groupId, memberId }` — owner only

## Files Modified

### Models
- `src/app/core/models/group.ts` — Preserved legacy `Group`. Added: `GroupBackend`, `GroupDetailBackend`, `GroupMember`, `GroupTicketBackend`, `CreateGroupPayload`, `UpdateGroupPayload`, `AddMemberPayload`, `RemoveMemberPayload`

### Services
- `src/app/core/services/group.service.ts` — Full rewrite from in-memory to HTTP. 8 gateway endpoints wired. Signal-based: `groups`, `loading`. Legacy data preserved as `LEGACY_GROUPS` and legacy methods renamed with `Legacy` suffix. Helpers: `getStatusLabel()`, `getStatusSeverity()`.

### Pages — Groups
- `src/app/pages/groups/groups.ts` — Adapted to `GroupBackend`. Implements `OnInit` to load groups. Form: only `name` + `description`. Actions: create, edit, deactivate (not delete). Navigation to group-users and ticket-dashboard uses string UUID ids. Added `saving` and `loading` signals.
- `src/app/pages/groups/groups.html` — Table columns: Nombre, Propietario, Descripcion, Estado (tag active/inactive), Miembros (icon link), Tickets (icon link), Acciones. Form dialog simplified to name + description only. Deactivate button uses `pi-ban` icon.
- `src/app/pages/groups/groups.css` — Added `.form-grid-single` for single-column form layout.

### Pages — Group Users (now "Group Members")
- `src/app/pages/group-users/group-users.ts` — **Major rewrite**: Changed from user CRUD to member management. Uses `GET /groups/:groupId/members` for member list. Add member via `POST /groups/members` with user dropdown (filtered by non-members). Remove member via `DELETE /groups/members`. Permission check uses `['groups', 'edit']` (canUpdate_Groups).
- `src/app/pages/group-users/group-users.html` — Title changed to "Miembros". Table: userName, completeName, Acciones (remove). Toolbar: "Agregar Miembro" button. Add member dialog with searchable `p-select` dropdown of available users.
- `src/app/pages/group-users/group-users.css` — Cleaned up old user-editing styles, kept member-relevant styles.

### Routing
- No changes needed. Routes already use `:groupId` as string parameter.

## Permission Mapping

| UI Action              | Backend Permission    | Directive Usage              |
|------------------------|-----------------------|------------------------------|
| See groups page        | `canRead_Groups`      | Route guard                  |
| Create group           | `canCreate_Groups`    | `*appHasPermission="['groups', 'add']"` |
| Edit group             | `canUpdate_Groups`    | `*appHasPermission="['groups', 'edit']"` |
| Deactivate group       | `canDelete_Groups`    | `*appHasPermission="['groups', 'delete']"` |
| Add/remove members     | `canUpdate_Groups`    | `*appHasPermission="['groups', 'edit']"` |

## API Response Shape

All responses follow: `{ statusCode, intOpCode, message, data: [] }` where `data` is always an array.

## Build Status

Build passes with 0 errors. Only pre-existing CSS budget warning on tickets module (unrelated).
