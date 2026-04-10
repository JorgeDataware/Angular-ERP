# AGENT_GUIDE_global.md — FASE 5: Global Integration

## Overview

FASE 5 completed the global integration audit and final changes to ensure the entire Angular frontend is fully wired to the API Gateway backend. All modules (Auth, Users, Groups, Tickets) were already connected in FASEs 1–4. This phase verified cross-cutting concerns, connected the register page, and confirmed the build passes cleanly.

## What Was Done in FASE 5

### 1. Full Codebase Audit

Every source file (`*.ts`, `*.html`) was scanned for:

- **Legacy field references** (`titulo`, `estado`, `asignadoA`, `fechaCreacion`, `fechaLimite`, `historialCambios`, `nombre`, `autor`, `integrantes`, `nivel`, `descripcion`, `comentarios`, `fullName` as old format, `username` as old format, `id: number`).
- **Result**: All legacy references exist ONLY in preserved legacy interfaces/data (marked "do NOT delete") and are NOT used by any active code paths. No fixes needed.

### 2. Pages Verified (Not Touched in FASEs 1–4)

| Page | Status | Notes |
|------|--------|-------|
| Landing (`pages/landing/`) | Clean | Pure static HTML, links to `/auth/login` and `/auth/register`. No services or models used. |
| Home (`pages/home/`) | Clean | Pure static HTML welcome dashboard. No services or models used. |
| App Component (`app.ts` + `app.html`) | Clean | Just `<router-outlet />`. No logic. |
| Main Layout (`layouts/main-layout/`) | Clean | Wraps `<app-sidebar>` + `<router-outlet>`. No changes needed. |

### 3. Register Page — Connected to `POST /users/register`

The register page was previously a client-side-only mockup with no HTTP calls. It was rewritten to:

- **Call `POST /users/register`** — a future endpoint (same body as `POST /users` but no auth/permissions required, no `permissionIds`).
- **Form fields adapted to backend model**: `userName`, `firstName`, `middleName` (optional), `lastName`, `email`, `password`, `confirmPassword`.
- **Removed**: `phone`, `address` fields (backend doesn't support them on User model).
- **Kept**: `isAdult` and `acceptTerms` checkboxes as frontend-only validation.
- **Loading state**: Button shows spinner during HTTP request, disabled when loading.
- **Error handling**: Shows backend error message (e.g., duplicate email) via PrimeNG toast.

**Files modified:**
- `src/app/core/models/user.ts` — Added `RegisterUserPayload` interface
- `src/app/core/services/user.service.ts` — Added `registerUser(payload)` method calling `POST /users/register`
- `src/app/pages/auth/register/register.ts` — Full rewrite: injects `UserService`, sends HTTP request
- `src/app/pages/auth/register/register.html` — Full rewrite: fields match backend model

### 4. Permission System Verification

All `*appHasPermission` usages were checked:

| File | Usage | Maps To |
|------|-------|---------|
| `groups.html:11` | `*appHasPermission="['groups', 'add']"` | `canCreate_Groups` |
| `groups.html:92` | `*appHasPermission="['groups', 'edit']"` | `canUpdate_Groups` |
| `groups.html:102` | `*appHasPermission="['groups', 'delete']"` | `canDelete_Groups` |
| `group-users.html:27` | `*appHasPermission="['groups', 'edit']"` | `canUpdate_Groups` |
| `group-users.html:82` | `*appHasPermission="['groups', 'edit']"` | `canUpdate_Groups` |

All mappings are correct via `toBackendPermission()` in `permission.ts`.

### 5. Route Guards Verification

| Route | Guard | Backend Permission |
|-------|-------|--------------------|
| `/dashboard` | `authGuard` | (auth only) |
| `/profile` | `authGuard` | (auth only) |
| `/groups` | `authGuard` + `permissionGuard('groups', 'view')` | `canRead_Groups` |
| `/groups/:groupId/users` | `authGuard` + `permissionGuard('users', 'view')` | `canRead_Users` |
| `/tickets` | `authGuard` + `permissionGuard('tickets', 'view')` | `canRead_Tickets` |
| `/tickets/:groupId` | `authGuard` + `permissionGuard('tickets', 'view')` | `canRead_Tickets` |
| `/ticket-dashboard` | `authGuard` + `permissionGuard('tickets', 'view')` | `canRead_Tickets` |
| `/ticket-dashboard/:groupId` | `authGuard` + `permissionGuard('tickets', 'view')` | `canRead_Tickets` |
| `/admin/users` | `authGuard` + `permissionGuard('users', 'add')` | `canCreate_Users` |

All guards correctly map frontend `(module, action)` to backend permission strings.

### 6. Build Verification

```
pnpm ng build → SUCCESS (0 errors)
```

Only warning: CSS budget exceeded on `tickets.css` (5.87 kB vs 4.00 kB limit). Not a build failure.

## Architecture Summary

### HTTP Flow

```
Angular Component → Service (HTTP call) → Auth Interceptor (adds JWT) → API Gateway → Microservice
```

### Key Architectural Decisions

1. **All HTTP calls go through API Gateway only** — no direct microservice URLs.
2. **JWT stored in localStorage**, attached via `authInterceptor` in every request.
3. **401 responses** → automatic redirect to `/auth/login` via interceptor.
4. **Permissions are flat string arrays** (`string[]`) from the backend, mapped to frontend `(module, action)` format via `toBackendPermission()`.
5. **Legacy types/data/methods preserved** in all models and services — marked with "do NOT delete" comments.
6. **All components are standalone** (no NgModules), using Angular signals and template-driven forms.

### Environment Configuration

- `.env` → `API_GATEWAY_URL=http://localhost:3000`
- `src/environments/environment.ts` → `apiGatewayUrl: 'http://localhost:3000'`
- `src/environments/environment.prod.ts` → `apiGatewayUrl: 'https://api.example.com'` (placeholder)
- `angular.json` → `fileReplacements` configured for production builds.

### File Map (All Modified Files Across FASEs 1–5)

**Config:**
- `.env`
- `angular.json`
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- `src/app/app.config.ts`

**Core Models:**
- `src/app/core/models/api-response.ts` (created in FASE 1)
- `src/app/core/models/permission.ts`
- `src/app/core/models/user.ts`
- `src/app/core/models/group.ts`
- `src/app/core/models/ticket.ts`

**Core Services:**
- `src/app/core/services/auth.service.ts`
- `src/app/core/services/user.service.ts`
- `src/app/core/services/group.service.ts`
- `src/app/core/services/ticket.service.ts`

**Core Guards & Interceptors:**
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/guards/permission.guard.ts`
- `src/app/core/interceptors/auth.interceptor.ts` (created in FASE 1)

**Shared:**
- `src/app/shared/directives/has-permission.directive.ts`

**Pages:**
- `src/app/pages/auth/login/login.ts` + `login.html`
- `src/app/pages/auth/register/register.ts` + `register.html`
- `src/app/pages/profile/profile.ts` + `profile.html` + `profile.css`
- `src/app/pages/admin-users/admin-users.ts` + `admin-users.html` + `admin-users.css`
- `src/app/pages/groups/groups.ts` + `groups.html` + `groups.css`
- `src/app/pages/group-users/group-users.ts` + `group-users.html` + `group-users.css`
- `src/app/pages/tickets/tickets.ts` + `tickets.html` + `tickets.css`
- `src/app/pages/ticket-dashboard/ticket-dashboard.ts` + `ticket-dashboard.html` + `ticket-dashboard.css`

**Components:**
- `src/app/components/sidebar/sidebar.ts` + `sidebar.html`

### Pages NOT Modified (No Changes Needed)

- `src/app/pages/landing/` — Static marketing page
- `src/app/pages/home/` — Static welcome dashboard
- `src/app/app.ts` + `app.html` — Root shell (`<router-outlet />`)
- `src/app/layouts/main-layout/` — Layout wrapper

## Pending Backend Endpoint

The `POST /users/register` endpoint does not yet exist on the API Gateway. It needs to be created with:

- **No authentication** required
- **No permission** required
- **Request body**: `{ userName, firstName, middleName?, lastName, email, password }` (same as `POST /users` minus `permissionIds`)
- **Response**: `{ statusCode, intOpCode, message, data: [{ id: "uuid" }] }`

## Known Issue

- `tickets.css` exceeds the 4 kB CSS budget by 1.87 kB. This is a warning only and does not block the build. Consider splitting ticket styles or increasing the budget in `angular.json` if needed.
