# API Endpoints Documentation - Users Microservice

## Resumen del Servicio

**Nombre:** Users Microservice  
**Descripción:** Microservicio responsable de la gestión completa de usuarios, autenticación, autorización y permisos dentro de un sistema de tickets y grupos  
**Tecnología:** .NET 9 with ASP.NET Core  
**Autenticación:** JWT Bearer Token (header Authorization o cookie 'jwt')  
**Ruta base interna:** `api/User`

### Notas Importantes

- Todos los endpoints usan una estructura de respuesta estandarizada
- El formato de respuesta incluye `statusCode`, `intOpCode`, `message`, y `data` (siempre un arreglo)
- La autenticación se valida mediante JWT con claims (NameIdentifier contiene el userId)
- Los permisos se validan contra módulos (Users, Groups, Tickets) y acciones (Create, Read, Update, Delete, Assign, UpdateStatus)
- Algunas validaciones de permisos permiten que el usuario actúe sobre sí mismo incluso sin el permiso general

---

## Enumeraciones Globales

### Status

Estado de una entidad (usuario, grupo, ticket)

| Valor | Nombre    | Descripción        |
|-------|-----------|--------------------|
| 1     | Active    | Entidad activa     |
| 2     | Inactive  | Entidad inactiva   |

### Modules

Módulos del sistema sobre los que se pueden asignar permisos

| Valor | Nombre   | Descripción                      |
|-------|----------|----------------------------------|
| 1     | Users    | Módulo de gestión de usuarios   |
| 2     | Groups   | Módulo de gestión de grupos     |
| 3     | Tickets  | Módulo de gestión de tickets    |

### Actions

Acciones que se pueden realizar sobre los módulos

| Valor | Nombre        | Descripción                                                                              |
|-------|---------------|------------------------------------------------------------------------------------------|
| 1     | Create        | Crear nuevas entidades                                                                   |
| 2     | Read          | Leer/consultar entidades                                                                 |
| 3     | Update        | Actualizar campos de entidades (excepto estado y asignación para tickets)                |
| 4     | Delete        | Eliminar o desactivar entidades                                                          |
| 5     | Assign        | Asignar tickets sin asignar a usuarios específicos                                       |
| 6     | UpdateStatus  | Actualizar el estado de tickets (Open, InProgress, Closed)                               |

---

## Permisos Globales

| Nombre                | Módulo   | Acción        | Descripción                                                                              |
|-----------------------|----------|---------------|------------------------------------------------------------------------------------------|
| Users.Create          | Users    | Create        | Permite crear nuevos usuarios en el sistema                                              |
| Users.Read            | Users    | Read          | Permite consultar información de usuarios                                                |
| Users.Update          | Users    | Update        | Permite actualizar datos de usuarios (o el propio usuario puede actualizar su info)     |
| Users.Delete          | Users    | Delete        | Permite desactivar/eliminar usuarios del sistema                                         |
| Groups.Create         | Groups   | Create        | Permite crear nuevos grupos                                                              |
| Groups.Read           | Groups   | Read          | Permite consultar información de grupos                                                  |
| Groups.Update         | Groups   | Update        | Permite actualizar datos de grupos                                                       |
| Groups.Delete         | Groups   | Delete        | Permite eliminar grupos                                                                  |
| Tickets.Create        | Tickets  | Create        | Permite crear nuevos tickets                                                             |
| Tickets.Read          | Tickets  | Read          | Permite consultar información de tickets                                                 |
| Tickets.Update        | Tickets  | Update        | Permite actualizar campos de tickets (excepto estado y asignación)                       |
| Tickets.Delete        | Tickets  | Delete        | Permite eliminar tickets                                                                 |
| Tickets.Assign        | Tickets  | Assign        | Permite asignar tickets sin asignar a usuarios específicos                               |
| Tickets.UpdateStatus  | Tickets  | UpdateStatus  | Permite actualizar el estado de tickets (Open → InProgress → Closed)                     |

---

## Tabla Resumen de Endpoints

| Method | Gateway Endpoint                                      | Internal Endpoint                   | Auth | Permissions   | Summary                                          |
|--------|-------------------------------------------------------|-------------------------------------|------|---------------|--------------------------------------------------|
| POST   | https://mi-gateway.onrender.com/users/                | api/User/CreateUser                 | ✓    | Users.Create  | Crear un nuevo usuario en el sistema             |
| POST   | https://mi-gateway.onrender.com/auth/login            | api/User/login                      | ✗    | None          | Autenticar usuario y obtener token JWT          |
| POST   | https://mi-gateway.onrender.com/auth/logout           | api/User/logout                     | ✓    | None          | Cerrar sesión del usuario autenticado           |
| GET    | https://mi-gateway.onrender.com/users/                | api/User/GetUsers                   | ✓    | Users.Read    | Obtener todos los usuarios con sus permisos      |
| GET    | https://mi-gateway.onrender.com/users/{userId}        | api/User/GetUserById/{userId}       | ✓    | Users.Read    | Obtener información detallada de un usuario      |
| GET    | https://mi-gateway.onrender.com/users/me              | api/User/Me                         | ✓    | None          | Obtener información del usuario autenticado      |
| PUT    | https://mi-gateway.onrender.com/users/{userId}/permissions | api/User/UpdateUserPermissions/{userId} | ✓ | Users.Update | Actualizar los permisos de un usuario |
| PUT    | https://mi-gateway.onrender.com/users/{userId}        | api/User/UpdateUser/{userId}        | ✓    | Users.Update* | Actualizar datos personales de un usuario        |
| PATCH  | https://mi-gateway.onrender.com/users/{userId}/password | api/User/ChangePassword/{userId}  | ✓    | Users.Update* | Cambiar la contraseña de un usuario              |
| GET    | https://mi-gateway.onrender.com/users/permissions     | api/User/permissions                | ✓    | Users.Read    | Obtener catálogo completo de permisos            |
| DELETE | https://mi-gateway.onrender.com/users/{userId}/status | api/User/{userId}/status            | ✓    | Users.Delete  | Desactivar o reactivar un usuario                |

\* _El usuario puede realizar la acción sobre sí mismo sin necesitar el permiso_

---

## Detalle de Endpoints

### 1. POST - Crear Usuario

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/`  
**Internal Endpoint:** `api/User/CreateUser`  
**Método:** POST

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Create (Module=1, Action=1)
- **Reglas de ownership:** No aplica

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)
- `Content-Type: application/json` (requerido)

**Body Schema:**

```json
{
  "UserName": "string (3-50 chars, requerido)",
  "FirstName": "string (2-100 chars, requerido)",
  "MiddleName": "string (0-100 chars, opcional)",
  "LastName": "string (2-100 chars, requerido)",
  "Email": "string email format (max 255 chars, requerido)",
  "Password": "string (min 8 chars, requerido, debe incluir mayúscula, minúscula, número y carácter especial)",
  "PermissionIds": ["uuid", "uuid", "..."] // opcional
}
```

**Ejemplo:**

```json
{
  "UserName": "jdoe",
  "FirstName": "John",
  "MiddleName": "Michael",
  "LastName": "Doe",
  "Email": "john.doe@example.com",
  "Password": "SecurePass123!",
  "PermissionIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901"
  ]
}
```

#### Responses

**✓ 201 - Success (SUSCR201)**

```json
{
  "statusCode": 201,
  "intOpCode": "SUSCR201",
  "message": "User created successfully.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

Ocurre cuando: No hay token JWT válido o el claim NameIdentifier no puede extraerse

```json
{
  "statusCode": 401,
  "intOpCode": "EUSAU401",
  "message": "Invalid or missing user authentication",
  "data": []
}
```

**✗ 403 - Forbidden (EUSFB403)**

Ocurre cuando: El usuario autenticado no tiene el permiso Users.Create

```json
{
  "statusCode": 403,
  "intOpCode": "EUSFB403",
  "message": "The user does not have the required permissions to perform this action.",
  "data": []
}
```

**✗ 400 - Bad Request (EUSBR400)**

Ocurre cuando: Error durante la creación (ej: email duplicado, validación fallida)

```json
{
  "statusCode": 400,
  "intOpCode": "EUSBR400",
  "message": "A user with the provided email already exists.",
  "data": []
}
```

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Create
- La contraseña se hashea usando PBKDF2 antes de almacenarse
- Se genera un salt único para cada usuario
- Si se proporcionan PermissionIds, se validan y asignan mediante la tabla user_permissions
- El usuario se crea con Status=Active por defecto
- No se permite crear usuarios con email duplicado

#### Notas para Frontend

- Este endpoint se usa típicamente en pantallas de administración de usuarios
- El campo PermissionIds debe poblarse desde el endpoint GET /users/permissions
- Mostrar validación en tiempo real para el formato de contraseña
- El email debe validarse con formato antes de enviar
- Tras crear exitosamente, refrescar la tabla de usuarios
- Manejar específicamente el error 400 para mostrar que el email ya existe
- No se retorna el objeto del usuario creado en data, solo confirmación

---

### 2. POST - Login

**Gateway Endpoint:** `https://mi-gateway.onrender.com/auth/login`  
**Internal Endpoint:** `api/User/login`  
**Método:** POST

#### Autenticación y Permisos

- **Requiere autenticación:** No
- **Tipo de auth:** None (endpoint público)
- **Permisos requeridos:** Ninguno

#### Request

**Headers:**
- `Content-Type: application/json` (requerido)

**Body Schema:**

```json
{
  "Email": "string email format (requerido)",
  "Password": "string (requerido)"
}
```

**Ejemplo:**

```json
{
  "Email": "john.doe@example.com",
  "Password": "SecurePass123!"
}
```

#### Responses

**✓ 200 - Success (SUSLG200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSLG200",
  "message": "Login successful.",
  "data": [
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresAt": "2026-04-06T15:30:00Z",
      "permissions": [
        "Users.Read",
        "Users.Create",
        "Tickets.Read"
      ]
    }
  ]
}
```

**✗ 401 - User Not Found (EUSAU401)**

Ocurre cuando: No existe un usuario con el email proporcionado

```json
{
  "statusCode": 401,
  "intOpCode": "EUSAU401",
  "message": "The user with the specified ID does not exist.",
  "data": []
}
```

**✗ 401 - Invalid Password (EUSAU401)**

Ocurre cuando: La contraseña no coincide con el hash almacenado

```json
{
  "statusCode": 401,
  "intOpCode": "EUSAU401",
  "message": "The provided username or password is incorrect.",
  "data": []
}
```

**✗ 401 - Inactive User (EUSAU401)**

Ocurre cuando: El usuario tiene Status=Inactive

```json
{
  "statusCode": 401,
  "intOpCode": "EUSAU401",
  "message": "The user account is inactive. Please contact support.",
  "data": []
}
```

**✗ 400 - Permissions Error (EUSBR400)**

Ocurre cuando: Falla la obtención de permisos después de validar credenciales (caso muy improbable)

#### Lógica de Negocio

- El usuario debe existir en la base de datos
- El usuario debe tener Status=Active
- La contraseña se verifica usando PBKDF2 contra el hash almacenado
- Se genera un JWT con duración de 60 minutos desde el momento del login
- El token incluye claims del usuario y sus permisos
- Los permisos se obtienen de la tabla user_permissions join permission
- Si el usuario no tiene permisos asignados, se retorna un array vacío de permissions

#### Notas para Frontend

- Este es el endpoint principal para el flujo de autenticación
- Almacenar el token en localStorage o sessionStorage
- Almacenar expiresAt para validar si el token está vigente
- Almacenar permissions para controlar UI (mostrar/ocultar botones según permisos)
- Manejar los 3 casos de error 401: usuario no existe, contraseña incorrecta, usuario inactivo
- Mostrar mensajes específicos para cada caso de error
- Redirigir al dashboard tras login exitoso
- El token debe incluirse en todas las peticiones subsecuentes en el header Authorization
- Considerar implementar auto-logout cuando expire el token (60 minutos)

---

### 3. POST - Logout

**Gateway Endpoint:** `https://mi-gateway.onrender.com/auth/logout`  
**Internal Endpoint:** `api/User/logout`  
**Método:** POST

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Ninguno (solo estar autenticado)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)

**Body:** No requiere body

#### Responses

**✓ 200 - Success (SUSLO200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSLO200",
  "message": "Logout successful.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

Ocurre cuando: No hay token JWT válido (manejado por middleware de ASP.NET Core)

#### Lógica de Negocio

- Solo se requiere estar autenticado
- El endpoint elimina la cookie 'jwt' del cliente
- El frontend debe eliminar el token almacenado en localStorage/sessionStorage
- No hay invalidación de token en servidor (el JWT sigue válido hasta su expiración)

#### Notas para Frontend

- Llamar a este endpoint antes de limpiar el token del frontend
- Después de recibir respuesta 200, eliminar token y permissions del almacenamiento
- Redirigir al usuario a la página de login
- Si falla (401), igual limpiar el almacenamiento local y redirigir a login
- El logout es principalmente una operación de frontend ya que el token no se invalida en servidor

---

### 4. GET - Obtener Todos los Usuarios

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/`  
**Internal Endpoint:** `api/User/GetUsers`  
**Método:** GET

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Read (Module=1, Action=2)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)

**Query Params:** Ninguno

#### Responses

**✓ 200 - Success (SUSRD200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSRD200",
  "message": "Users retrieved successfully.",
  "data": [
    {
      "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "UserName": "jdoe",
      "FirstName": "John",
      "MiddleName": "Michael",
      "LastName": "Doe",
      "Email": "john.doe@example.com",
      "status": 1,
      "Permissions": [
        {
          "Module": 1,
          "Action": 2,
          "Name": "Users.Read"
        },
        {
          "Module": 3,
          "Action": 1,
          "Name": "Tickets.Create"
        }
      ]
    },
    {
      "Id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "UserName": "asmith",
      "FirstName": "Alice",
      "MiddleName": null,
      "LastName": "Smith",
      "Email": "alice.smith@example.com",
      "status": 1,
      "Permissions": []
    }
  ]
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Read
- Se retornan TODOS los usuarios del sistema sin filtros de paginación
- Cada usuario incluye su lista completa de permisos
- Los usuarios sin permisos tienen un array Permissions vacío
- Los resultados se ordenan por user_name
- Se usa LEFT JOIN por lo que usuarios sin permisos también se retornan

#### Notas para Frontend

- Este endpoint es ideal para poblar tablas de administración de usuarios
- Usar data[].Permissions para mostrar badges o chips de permisos por usuario
- Filtrar por status para mostrar solo activos o inactivos según vista
- Implementar paginación, ordenamiento y búsqueda en el frontend
- El campo MiddleName puede ser null, manejarlo en la UI
- Usar los valores de status: 1=Active, 2=Inactive para mostrar íconos o colores
- Los IDs de usuarios son necesarios para operaciones de edición/eliminación
- Considerar cachear esta respuesta y refrescar solo cuando se creen/actualicen usuarios

---

### 5. GET - Obtener Usuario por ID

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/{userId}`  
**Internal Endpoint:** `api/User/GetUserById/{userId}`  
**Método:** GET

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Read (Module=1, Action=2)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)

**Route Params:**
- `userId` (UUID, requerido) - ID único del usuario a consultar

#### Responses

**✓ 200 - Success (SUSRD200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSRD200",
  "message": "User retrieved successfully.",
  "data": [
    {
      "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_name": "jdoe",
      "first_name": "John",
      "middle_name": "Michael",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "status": 1
    }
  ]
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

**✗ 404 - Not Found (EUSNF404)**

Ocurre cuando: No existe un usuario con el userId proporcionado

```json
{
  "statusCode": 404,
  "intOpCode": "EUSNF404",
  "message": "The user with the specified ID does not exist.",
  "data": []
}
```

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Read
- El usuario solicitado debe existir en la base de datos
- Se retorna UserDto sin la lista de permisos (a diferencia de GetUsers)
- Los nombres de los campos en la respuesta usan snake_case (user_name, first_name, etc.)

#### Notas para Frontend

- Usar este endpoint para modales de detalle de usuario
- Útil para formularios de edición pre-poblados
- El response usa snake_case en los nombres de campos, mapearlo a camelCase si es necesario
- No incluye permisos, usar GET /users/permissions si se necesitan
- Manejar el 404 mostrando mensaje de usuario no encontrado
- El campo middle_name puede ser null

---

### 6. GET - Obtener Usuario Autenticado (Me)

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/me`  
**Internal Endpoint:** `api/User/Me`  
**Método:** GET

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Ninguno (solo estar autenticado)
- **Reglas de ownership:** El usuario solo puede obtener su propia información (determinada por el JWT)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)

#### Responses

**✓ 200 - Success (SUSME200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSME200",
  "message": "Authenticated user retrieved successfully.",
  "data": [
    {
      "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_name": "jdoe",
      "first_name": "John",
      "middle_name": "Michael",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "status": 1
    }
  ]
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 404 - Not Found (EUSNF404)**

Ocurre cuando: El userId del JWT no existe en la base de datos (caso muy improbable, solo si se borró el usuario después del login)

#### Lógica de Negocio

- El usuario debe estar autenticado con un JWT válido
- El userId se extrae del claim NameIdentifier del token
- No se requieren permisos específicos
- Retorna UserDto sin permisos

#### Notas para Frontend

- Usar este endpoint para poblar el perfil del usuario en la UI
- Llamar después del login para obtener datos completos del usuario
- Útil para mostrar nombre y email en headers/navbars
- Cachear la respuesta y solo refrescar tras actualizaciones del perfil
- No incluye permisos; los permisos ya vienen en el login
- El campo middle_name puede ser null
- Usar snake_case a camelCase mapping si es necesario

---

### 7. PUT - Actualizar Permisos de Usuario

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/{userId}/permissions`  
**Internal Endpoint:** `api/User/UpdateUserPermissions/{userId}`  
**Método:** PUT

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Update (Module=1, Action=3)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)
- `Content-Type: application/json` (requerido)

**Route Params:**
- `userId` (UUID, requerido) - ID del usuario cuyos permisos se van a actualizar

**Body Schema:**

```json
{
  "permissionIds": ["uuid", "uuid", "..."]
}
```

**Ejemplo:**

```json
{
  "permissionIds": [
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "c3d4e5f6-a7b8-9012-cdef-123456789012"
  ]
}
```

#### Responses

**✓ 200 - Success (SUSPM200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSPM200",
  "message": "User permissions updated successfully.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

**✗ 404 - Not Found (EUSNF404)**

**✗ 400 - Bad Request (EUSBR400)**

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Update
- El usuario objetivo debe existir en la base de datos
- Los permisos existentes se ELIMINAN completamente antes de insertar los nuevos
- La operación es una sustitución completa, no un merge
- Si permissionIds está vacío, se eliminarán todos los permisos del usuario
- Los permissionIds deben existir en la tabla permission

#### Notas para Frontend

- Este endpoint reemplaza TODOS los permisos, no es un merge
- Usar checkboxes o multi-select para elegir permisos
- Pre-poblar con GET /users/{userId} y luego GET /users/permissions
- Enviar la lista completa de permisos deseados, no solo los nuevos
- Tras actualizar exitosamente, refrescar la lista de usuarios
- Mostrar confirmación antes de actualizar permisos
- Considerar que el usuario podría quedarse sin permisos si se envía array vacío
- Manejar el error 404 si el usuario fue eliminado entre la carga y el submit

---

### 8. PUT - Actualizar Datos de Usuario

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/{userId}`  
**Internal Endpoint:** `api/User/UpdateUser/{userId}`  
**Método:** PUT

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Update (Module=1, Action=3) **O** ser el mismo usuario
- **Reglas de ownership:** El usuario puede actualizar su propia información sin necesidad del permiso Users.Update

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)
- `Content-Type: application/json` (requerido)

**Route Params:**
- `userId` (UUID, requerido) - ID del usuario a actualizar

**Body Schema:**

```json
{
  "UserName": "string (requerido)",
  "FirstName": "string (requerido)",
  "MiddleName": "string (opcional)",
  "LastName": "string (requerido)",
  "Email": "string (requerido)"
}
```

**Ejemplo:**

```json
{
  "UserName": "jdoe_updated",
  "FirstName": "John",
  "MiddleName": "Michael",
  "LastName": "Doe",
  "Email": "john.doe.new@example.com"
}
```

#### Responses

**✓ 200 - Success (SUSUP200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSUP200",
  "message": "User updated successfully.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

**✗ 404 - Not Found (EUSNF404)**

#### Lógica de Negocio

- El usuario puede actualizar su propia información (requesterId == userId) sin necesidad de permisos especiales
- Si el usuario intenta actualizar a otro usuario, necesita el permiso Users.Update
- La validación de permisos usa CheckUserPermissionsOrIsHimself
- El usuario debe existir en la base de datos
- Se actualiza usando AutoMapper desde PatchUserRequest al User entity
- No se puede cambiar la contraseña mediante este endpoint (usar ChangePassword)

#### Notas para Frontend

- Permitir a los usuarios editar su propio perfil sin verificar permisos
- Para administradores, verificar permiso Users.Update antes de mostrar opción de editar otros usuarios
- Pre-poblar el formulario con GET /users/{userId} o GET /users/me
- Validar formato de email en frontend antes de enviar
- Tras actualizar exitosamente, refrescar los datos mostrados en la UI
- Si el usuario actualiza su propio perfil, actualizar también el contexto de usuario en la app
- Manejar el 404 si el usuario fue eliminado entre la carga y el submit
- MiddleName puede ser null o string vacío

---

### 9. PATCH - Cambiar Contraseña

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/{userId}/password`  
**Internal Endpoint:** `api/User/ChangePassword/{userId}`  
**Método:** PATCH

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Update (Module=1, Action=3) **O** ser el mismo usuario
- **Reglas de ownership:**
  - Si requesterId == userId, el usuario está cambiando su propia contraseña y DEBE proporcionar CurrentPassword válida
  - Si requesterId != userId, se requiere permiso Users.Update y NO se valida CurrentPassword

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)
- `Content-Type: application/json` (requerido)

**Route Params:**
- `userId` (UUID, requerido) - ID del usuario cuya contraseña se va a cambiar

**Body Schema:**

```json
{
  "CurrentPassword": "string (requerido si es el propio usuario)",
  "NewPassword": "string (requerido)"
}
```

**Ejemplo:**

```json
{
  "CurrentPassword": "OldSecurePass123!",
  "NewPassword": "NewSecurePass456!"
}
```

#### Responses

**✓ 200 - Success (SUSPW200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSPW200",
  "message": "Password updated successfully.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 401 - Invalid Current Password (EUSAU401)**

Ocurre cuando: El usuario intenta cambiar su propia contraseña pero CurrentPassword es incorrecta

```json
{
  "statusCode": 401,
  "intOpCode": "EUSAU401",
  "message": "The provided username or password is incorrect.",
  "data": []
}
```

**✗ 403 - Forbidden (EUSFB403)**

**✗ 404 - Not Found (EUSNF404)**

**✗ 400 - Bad Request (EUSBR400)**

#### Lógica de Negocio

- Si requesterId == userId, se valida que CurrentPassword sea correcta antes de cambiar
- Si requesterId != userId, se requiere permiso Users.Update y NO se valida CurrentPassword
- La nueva contraseña se hashea usando PBKDF2 con un nuevo salt generado
- El usuario debe existir en la base de datos
- La lógica diferencia entre auto-cambio y cambio administrativo

#### Notas para Frontend

- Para usuarios cambiando su propia contraseña: requerir CurrentPassword, NewPassword y ConfirmPassword (este último validado en frontend)
- Para admins cambiando contraseña de otros: solo requerir NewPassword
- Mostrar indicador de fortaleza de contraseña en tiempo real
- Validar que NewPassword cumpla requisitos antes de enviar
- Tras cambio exitoso, mostrar confirmación y (si es el propio usuario) considerar re-login
- Manejar específicamente el 401 con mensaje de contraseña actual incorrecta
- Diferenciar UI según si es perfil propio o ajeno
- Considerar logout automático después de cambio exitoso de contraseña propia

---

### 10. GET - Obtener Catálogo de Permisos

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/permissions`  
**Internal Endpoint:** `api/User/permissions`  
**Método:** GET

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Read (Module=1, Action=2)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)

#### Responses

**✓ 200 - Success (SUSRP200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSRP200",
  "message": "Permissions retrieved successfully.",
  "data": [
    {
      "Id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "Name": "Users.Create"
    },
    {
      "Id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "Name": "Users.Read"
    },
    {
      "Id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "Name": "Users.Update"
    },
    {
      "Id": "d4e5f6a7-b8c9-0123-def1-234567890123",
      "Name": "Users.Delete"
    },
    {
      "Id": "e5f6a7b8-c9d0-1234-ef12-345678901234",
      "Name": "Groups.Create"
    },
    {
      "Id": "f6a7b8c9-d0e1-2345-f123-456789012345",
      "Name": "Tickets.Read"
    }
  ]
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Read
- Se retornan TODOS los permisos del sistema sin filtros
- La respuesta incluye Id (GUID) y Name (string formato Module.Action)
- Este endpoint es de catálogo, no retorna permisos de un usuario específico

#### Notas para Frontend

- Usar este endpoint para poblar checkboxes o selects en formularios de permisos
- Cachear la respuesta ya que los permisos del sistema son relativamente estáticos
- Los IDs son necesarios para crear/actualizar usuarios con permisos
- El campo Name puede usarse para mostrar etiquetas legibles (ej: 'Users.Create' → 'Crear Usuarios')
- Agrupar permisos por módulo (Users, Groups, Tickets) en la UI para mejor UX
- Considerar mapear Action numbers a nombres legibles (1=Create, 2=Read, etc.)

---

### 11. DELETE - Desactivar/Reactivar Usuario

**Gateway Endpoint:** `https://mi-gateway.onrender.com/users/{userId}/status`  
**Internal Endpoint:** `api/User/{userId}/status`  
**Método:** DELETE

#### Autenticación y Permisos

- **Requiere autenticación:** Sí
- **Tipo de auth:** Bearer Token
- **Permisos requeridos:** Users.Delete (Module=1, Action=4)

#### Request

**Headers:**
- `Authorization: Bearer {jwt_token}` (requerido)
- `Content-Type: application/json` (requerido)

**Route Params:**
- `userId` (UUID, requerido) - ID del usuario cuyo estado se va a cambiar

**Body Schema:**

```json
{
  "Status": 1 // 1=Active, 2=Inactive
}
```

**Ejemplo:**

```json
{
  "Status": 2
}
```

#### Responses

**✓ 200 - Success (SUSDU200)**

```json
{
  "statusCode": 200,
  "intOpCode": "SUSDU200",
  "message": "User deactivated successfully.",
  "data": []
}
```

**✗ 401 - Unauthorized (EUSAU401)**

**✗ 403 - Forbidden (EUSFB403)**

**✗ 404 - Not Found (EUSNF404)**

**✗ 400 - Bad Request (EUSBR400)**

#### Lógica de Negocio

- El usuario autenticado debe tener permiso Users.Delete
- El usuario objetivo debe existir en la base de datos
- Si el usuario ya tiene el estado especificado, se retorna éxito sin hacer cambios
- Los usuarios inactivos (Status=2) NO pueden hacer login
- Este es un soft-delete, el usuario no se elimina de la base de datos
- El endpoint se puede usar tanto para desactivar (Status=2) como para reactivar (Status=1)

#### Notas para Frontend

- Usar botón de 'Desactivar' para usuarios activos y 'Activar' para inactivos
- Mostrar confirmación antes de cambiar el estado
- El mensaje siempre dice 'deactivated' aunque se esté reactivando (inconsistencia en el mensaje)
- Tras cambio exitoso, refrescar la lista de usuarios
- Mostrar visualmente usuarios inactivos (ej: texto gris, ícono de 'bloqueado')
- Considerar que usuarios inactivos no pueden hacer login
- Enviar Status=2 para desactivar, Status=1 para reactivar
- El método HTTP es DELETE pero no elimina permanentemente el usuario

---

## Inconsistencias Detectadas

### 1. Endpoint Gateway Duplicado (Severidad: Media)

**Endpoint afectado:** CreateUser, GetUsers  
**Problema:** Ambos endpoints mapean al mismo gateway endpoint `/` pero con diferentes métodos HTTP (POST vs GET)  
**Recomendación:** Asegurarse que el API Gateway distinga correctamente por método HTTP. Esto es correcto según REST, pero debe estar configurado apropiadamente en el gateway.

### 2. Comentario de Gateway Incorrecto (Severidad: Baja)

**Endpoint afectado:** UpdateUser  
**Problema:** El comentario "Corresponde a" indica `/` pero debería ser `/{userId}` según estándar REST  
**Recomendación:** Actualizar comentario a `https://mi-gateway.onrender.com/users/{userId}`

### 3. Inconsistencia en Naming de DTOs (Severidad: Baja)

**Endpoint afectado:** GetUserById, Me  
**Problema:** UserDto usa snake_case (user_name, first_name) mientras UserWithPermissionsDto usa PascalCase  
**Recomendación:** Estandarizar el naming en todas las respuestas DTOs

### 4. Mensaje de Respuesta Genérico (Severidad: Baja)

**Endpoint afectado:** DeactivateUser  
**Problema:** El mensaje siempre dice "User deactivated successfully" incluso cuando se reactiva (Status=1)  
**Recomendación:** Usar mensaje dinámico: "User status updated successfully"

### 5. Método HTTP Semánticamente Incorrecto (Severidad: Media)

**Endpoint afectado:** DeactivateUser  
**Problema:** Usa método DELETE pero la operación es realmente un PATCH/PUT de estado, no una eliminación  
**Recomendación:** Considerar cambiar a PATCH para mayor claridad semántica REST

---

## Resumen Ejecutivo

### Estadísticas

- **Total de endpoints documentados:** 11
- **Endpoints con comentario "Corresponde a":** 11 (100%)
- **Endpoints públicos:** 1 (Login)
- **Endpoints protegidos:** 10

### Distribución por Método HTTP

- **POST:** 3 (Create User, Login, Logout)
- **GET:** 4 (Get Users, Get User by ID, Get Me, Get Permissions)
- **PUT:** 2 (Update Permissions, Update User)
- **PATCH:** 1 (Change Password)
- **DELETE:** 1 (Deactivate User)

### Inconsistencias Detectadas

- **Total:** 5 inconsistencias
- **Severidad Media:** 2
- **Severidad Baja:** 3

---

**Documento generado el:** 2026-04-06  
**Versión del servicio:** Users Microservice v1.0  
**Contacto:** Para dudas sobre este servicio, consultar con el equipo de backend
