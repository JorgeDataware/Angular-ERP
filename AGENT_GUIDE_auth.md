# AGENT_GUIDE_auth.md — Modulo de Autenticacion

## Estado: COMPLETADO

## Resumen de cambios

FASE 1 conecta el modulo de autenticacion del frontend Angular 21 al API Gateway real.
Antes: login/logout hardcoded con datos en memoria, sin HTTP, sin JWT.
Despues: login/logout via HTTP al API Gateway, JWT almacenado en localStorage, permisos como string[] del backend.

---

## Archivos creados

| Archivo | Proposito |
|---------|-----------|
| `.env` | Variable `API_GATEWAY_URL` para configuracion de despliegue |
| `src/environments/environment.ts` | Entorno de desarrollo: `apiGatewayUrl: 'http://localhost:3000'` |
| `src/environments/environment.prod.ts` | Entorno de produccion (reemplazado via angular.json fileReplacements) |
| `src/app/core/models/api-response.ts` | Interfaces: `ApiResponse<T>`, `LoginResponseData`, `UserMeResponseData` |
| `src/app/core/interceptors/auth.interceptor.ts` | Interceptor HTTP: agrega Bearer token, maneja 401 |

## Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `angular.json` | Agregado `fileReplacements` en configuracion production |
| `src/app/app.config.ts` | Agregado `provideHttpClient(withInterceptors([authInterceptor]))` |
| `src/app/core/models/permission.ts` | Preservados tipos legacy. Agregados: `AuthUserBackend`, `BackendPermission`, funciones `toBackendPermission()`, `hasBackendPermission()`, `hasRawPermission()` |
| `src/app/core/services/auth.service.ts` | Reescrito completamente: HTTP login/logout, JWT storage, permission signals, `fullName` computed, restauracion de sesion |
| `src/app/core/guards/auth.guard.ts` | Ahora llama `restoreSession()` y verifica `isLoggedIn()` basado en token JWT |
| `src/app/core/guards/permission.guard.ts` | Sin cambios de firma, usa `hasPermission()` que internamente traduce a formato backend |
| `src/app/shared/directives/has-permission.directive.ts` | Sin cambios funcionales, solo documentacion agregada |
| `src/app/pages/auth/login/login.ts` | Cambiado de login sincrono a Observable HTTP, agregado estado `loading`, manejo de errores HTTP |
| `src/app/pages/auth/login/login.html` | Boton con estado loading/spinner, inputs deshabilitados durante carga, credenciales hardcoded removidas |
| `src/app/components/sidebar/sidebar.ts` | Usa `authService.fullName`, logout con Observable y navegacion programatica |
| `src/app/components/sidebar/sidebar.html` | Usa `userFullName()` en lugar de `currentUser()!.fullName` |
| `src/app/pages/profile/profile.ts` | Fix minimo: usa `authService.fullName()` en vez de `user.fullName` |
| `src/app/pages/tickets/tickets.ts` | Fix minimo: 3 ocurrencias de `currentUser()?.fullName` cambiadas a `authService.fullName()` |

---

## Flujo de autenticacion

### Login
1. Usuario ingresa email y password en `/auth/login`
2. `Login.onLogin()` llama `authService.login(email, password)`
3. `AuthService.login()` hace `POST /auth/login` al API Gateway
4. Gateway responde: `{ statusCode: 200, intOpCode: "SUSLG200", message: "...", data: [{ token, expiresAt, permissions[] }] }`
5. Token, permisos y expiresAt se almacenan en localStorage
6. Se llama `GET /users/me` para obtener perfil del usuario
7. Gateway responde: `{ data: [{ id, userName, firstName, middleName, lastName, email }] }`
8. Se construye `AuthUserBackend` y se almacena en localStorage y signal
9. Redireccion a `/groups`

### Logout
1. `Sidebar.logout()` llama `authService.logout()`
2. `AuthService.logout()` hace `POST /auth/logout` con Bearer token
3. Independientemente del resultado HTTP, limpia localStorage y signals
4. Redireccion a `/auth/login`

### Restauracion de sesion
1. `authGuard` llama `authService.restoreSession()`
2. Si hay token valido (no expirado) en localStorage, los signals ya estan cargados
3. Si el token expiro, limpia todo y redirige a login

---

## Modelo de permisos

### Backend (real)
```
["canRead_Users", "canCreate_Groups", "canUpdate_Tickets", "canDelete_Users", "canAssign_Tickets", "canUpdateStatus_Tickets"]
```

### Frontend (legacy preservado)
```typescript
type PermissionModule = 'groups' | 'users' | 'tickets';
type PermissionAction = 'view' | 'add' | 'edit' | 'delete';
```

### Mapeo automatico
| Frontend | Backend |
|----------|---------|
| `('groups', 'view')` | `canRead_Groups` |
| `('users', 'add')` | `canCreate_Users` |
| `('tickets', 'edit')` | `canUpdate_Tickets` |
| `('tickets', 'delete')` | `canDelete_Tickets` |

La funcion `toBackendPermission(module, action)` realiza esta conversion.
`hasBackendPermission(permissions, module, action)` verifica si el array contiene el permiso.

### Permisos especiales (sin mapeo directo)
- `canAssign_Tickets` — usar `authService.hasRawPermission('canAssign_Tickets')`
- `canUpdateStatus_Tickets` — usar `authService.hasRawPermission('canUpdateStatus_Tickets')`

---

## Almacenamiento en localStorage

| Clave | Contenido |
|-------|-----------|
| `auth_token` | JWT token string |
| `auth_permissions` | JSON string[] de permisos backend |
| `auth_expires_at` | ISO date string de expiracion del token |
| `auth_user` | JSON de `AuthUserBackend` |

---

## Interceptor HTTP

`auth.interceptor.ts`:
- Agrega `Authorization: Bearer {token}` a TODAS las peticiones si hay token
- Si recibe 401, limpia localStorage y redirige a `/auth/login`

---

## Endpoints del API Gateway usados en este modulo

| Metodo | Endpoint | Descripcion | Auth requerida |
|--------|----------|-------------|----------------|
| POST | `/auth/login` | Login | No |
| POST | `/auth/logout` | Logout | Si (Bearer) |
| GET | `/users/me` | Perfil del usuario autenticado | Si (Bearer) |

---

## Notas para fases posteriores

1. **profile.ts** y **tickets.ts** tienen fixes minimos de compilacion; sus servicios aun usan datos mock
2. Los servicios de Users, Groups y Tickets aun NO hacen HTTP — eso es FASE 2, 3 y 4
3. La interfaz `AuthUser` legacy se preserva pero NO se usa activamente
4. El array `USERS` hardcoded en `AuthService` se preserva pero NO se usa
5. `app.routes.ts` no necesito cambios — `permissionGuard('groups', 'view')` funciona igual
