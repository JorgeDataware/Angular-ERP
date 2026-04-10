# AGENT_GUIDE_users.md — Fase 2: Módulo de Usuarios

## Estado: COMPLETADO

## Resumen

Se migró el módulo de Usuarios de datos hardcoded en memoria a llamadas HTTP reales contra el API Gateway. Se adaptaron todos los modelos, servicios y componentes al formato de datos del backend.

---

## Endpoints del API Gateway utilizados

| Método | Endpoint | Descripción | Permiso requerido |
|--------|----------|-------------|-------------------|
| GET | `/users` | Lista todos los usuarios | `canRead_Users` |
| GET | `/users/me` | Perfil del usuario autenticado | (autenticado) |
| GET | `/users/:userId` | Usuario por ID | `canRead_Users` |
| POST | `/users` | Crear usuario | `canCreate_Users` |
| PUT | `/users/:userId` | Actualizar usuario | Delegado a microservicio |
| PUT | `/users/:userId/permissions` | Actualizar permisos | `canUpdate_Users` |
| PATCH | `/users/:userId/password` | Cambiar contraseña | Delegado a microservicio |
| DELETE | `/users/:userId/status` | Desactivar usuario (soft delete) | `canDelete_Users` |
| GET | `/users/permissions` | Lista permisos disponibles | `canRead_Users` |

---

## Formato de datos del backend

### UserBackend (GET /users, GET /users/:userId)
```json
{
  "id": "00000000-0000-0000-0000-000000000001",  // UUID string
  "userName": "admin",
  "firstName": "Jorge",
  "middleName": "Luis",         // puede ser null
  "lastName": "Pérez",
  "email": "jorge@test.com",
  "permissions": ["canRead_Users", "canRead_Groups"]  // string[]
}
```

### PermissionDefinition (GET /users/permissions)
```json
{
  "id": "019d5a1b-cee1-7e2d-b1b0-79a8c75197e3",  // UUID
  "name": "canRead_Users"
}
```

### CreateUserPayload (POST /users)
```json
{
  "userName": "jdoe",           // requerido
  "firstName": "John",          // requerido
  "middleName": "Michael",      // opcional, puede ser null
  "lastName": "Doe",            // requerido
  "email": "john@test.com",     // requerido, único
  "password": "SecurePass123"   // requerido
}
```

### UpdateUserPayload (PUT /users/:userId)
Todos los campos son opcionales. Solo enviar los que cambian.

### UpdatePermissionsPayload (PUT /users/:userId/permissions)
```json
{
  "permissionIds": ["uuid1", "uuid2"]  // array de UUIDs de permisos
}
```

### ChangePasswordPayload (PATCH /users/:userId/password)
```json
{
  "currentPassword": "OldPass",   // requerido al cambiar propia contraseña
  "newPassword": "NewPass"        // siempre requerido
}
```

### DeactivateUserPayload (DELETE /users/:userId/status)
```json
{
  "status": 0  // 0 = inactivo, 1 = activo
}
```

---

## Archivos creados / modificados

### Modelos
- **`src/app/core/models/user.ts`** — Se preservó la interfaz legacy `User`. Se añadieron:
  - `UserBackend` — modelo del backend (id: string UUID, userName, firstName, middleName, lastName, email, permissions: string[])
  - `CreateUserPayload` — para POST /users
  - `UpdateUserPayload` — para PUT /users/:userId
  - `ChangePasswordPayload` — para PATCH /users/:userId/password
  - `UpdatePermissionsPayload` — para PUT /users/:userId/permissions
  - `PermissionDefinition` — para GET /users/permissions ({id, name})
  - `DeactivateUserPayload` — para DELETE /users/:userId/status

### Servicios
- **`src/app/core/services/user.service.ts`** — Reescrito completamente:
  - `users` signal con `UserBackend[]` (antes tenía datos hardcoded)
  - `availablePermissions` signal con `PermissionDefinition[]`
  - `loading` signal para estado de carga
  - `loadUsers()` → GET /users
  - `getUserById(userId: string)` → GET /users/:userId
  - `loadAvailablePermissions()` → GET /users/permissions
  - `createUser(payload)` → POST /users (recarga lista después)
  - `updateUser(userId, payload)` → PUT /users/:userId (recarga lista después)
  - `updatePermissions(userId, payload)` → PUT /users/:userId/permissions (recarga lista después)
  - `changePassword(userId, payload)` → PATCH /users/:userId/password
  - `deactivateUser(userId)` → DELETE /users/:userId/status (recarga lista después)
  - `getFullName(user)` — helper para construir nombre completo
  - `getAllUserNames()` — preservado para compatibilidad con tickets
  - Legacy: `LEGACY_USERS` array hardcoded preservado, `getEmptyPermissions()` preservado, `getUsersByGroup()` preservado

### Componentes

#### admin-users (Gestión de Usuarios)
- **`src/app/pages/admin-users/admin-users.ts`**:
  - Implementa `OnInit` para cargar usuarios y permisos disponibles al inicio
  - Formulario adaptado: userName, firstName, middleName, lastName, email, password (solo al crear)
  - Diálogo de permisos: lista de checkboxes con `PermissionDefinition` (UUID + name), ya no es una matriz booleana module×action
  - Todas las operaciones son async (Observable), con estados `saving` y `savingPermissions`
  - Eliminación es "desactivar" (soft delete via DELETE /users/:userId/status)
  - Manejo de errores HTTP con mensajes específicos (409 = email duplicado, etc.)
- **`src/app/pages/admin-users/admin-users.html`**:
  - Tabla: columnas userName, Nombre completo, Email, Permisos (conteo), Acciones
  - Se removieron columnas: ID, Teléfono, Grupo, Estado (no existen en backend)
  - Botón "Desactivar" en lugar de "Eliminar"
  - Formulario de creación/edición con campos del backend + password al crear
  - Diálogo de permisos con lista de checkboxes scrollable
  - Loading state en la tabla
- **`src/app/pages/admin-users/admin-users.css`**:
  - Removidos estilos de la vieja matriz de permisos (permissions-table, permissions-header-row, permissions-row, permissions-module-cell, etc.)
  - Añadidos estilos para permissions-list, permissions-item, permission-label, permissions-empty, permissions-count

#### profile (Mi Perfil)
- **`src/app/pages/profile/profile.ts`**:
  - Implementa `OnInit` para cargar datos del perfil desde `authService.currentUser()`
  - Campos: userName, firstName, middleName, lastName, email
  - Se removieron: phone, address, isAdult, acceptTerms (no existen en backend)
  - Se removió password inline — ahora hay un diálogo separado para cambiar contraseña
  - `saveProfile()` llama a `userService.updateUser()` con PUT /users/:userId
  - `changePassword()` llama a `userService.changePassword()` con PATCH /users/:userId/password
  - `confirmDelete()` llama a `userService.deactivateUser()` con DELETE /users/:userId/status
  - Estados de loading: `saving`, `changingPassword`, `loadingProfile`
  - Actualiza `authService.currentUser` signal después de guardar perfil
- **`src/app/pages/profile/profile.html`**:
  - Formulario con campos del backend: userName, Nombre, Segundo nombre, Apellido, Email
  - Removidos: Teléfono, Dirección, Contraseña inline, checkboxes isAdult/acceptTerms
  - Nuevo botón "Cambiar contraseña" que abre un diálogo
  - Diálogo de cambio de contraseña: contraseña actual + nueva + confirmar
  - Sección de tickets asignados preservada (se integra en FASE 4)
- **`src/app/pages/profile/profile.css`**:
  - Añadido `.password-dialog-content` para el diálogo de contraseña

#### group-users (Usuarios del Grupo)
- **`src/app/pages/group-users/group-users.ts`**:
  - Adaptado a `UserBackend` en lugar de `User`
  - Formulario con campos del backend: userName, firstName, middleName, lastName, email, password
  - Operaciones async: `createUser`, `updateUser`, `deactivateUser`
  - NOTA: Actualmente muestra TODOS los usuarios. La integración real con GET /groups/:groupId/members se hará en FASE 3 (módulo de Grupos)
- **`src/app/pages/group-users/group-users.html`**:
  - Tabla: columnas userName, Nombre completo, Email, Acciones
  - Removidas: Teléfono, Dirección
  - Formulario de creación/edición con campos del backend
  - Password solo al crear

---

## Diferencias clave frontend ↔ backend

| Concepto | Frontend viejo | Backend real |
|----------|---------------|--------------|
| ID | `number` | `string` (UUID) |
| Nombre | `fullName` (string) | `firstName` + `middleName` + `lastName` |
| Username | `username` | `userName` |
| Teléfono | `phone` | NO EXISTE |
| Dirección | `address` | NO EXISTE |
| Grupo | `groupId` (en User) | Se gestiona via /groups/:groupId/members |
| Estado | `active: boolean` | Gestión via DELETE /users/:userId/status |
| Permisos | `RolePermissions` (objeto booleano anidado) | `string[]` (nombres de permisos) |
| Asignación de permisos | Checkboxes module×action | Checkboxes con UUIDs de PermissionDefinition |
| Eliminación | `deleteUser(id)` (borrado real) | `deactivateUser(id)` → DELETE /status (soft delete) |
| Cambio de contraseña | Campo inline en perfil | PATCH /users/:userId/password (diálogo separado) |

---

## Pendientes para fases futuras

1. **FASE 3 (Grupos)**: El componente `group-users` actualmente muestra todos los usuarios. Debe integrarse con `GET /groups/:groupId/members` para filtrar por miembros del grupo.
2. **FASE 4 (Tickets)**: La sección "Mis Tickets Asignados" en el perfil aún usa datos del `ticketService` legacy. Se adaptará cuando se migre el módulo de tickets.
3. El `getAllUserNames()` del UserService actualmente depende de que `loadUsers()` haya sido llamado previamente. Los componentes de tickets lo usan para autocompletado.
