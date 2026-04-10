# Documentación de Endpoints - Tickets Service

## Resumen del Servicio

**Nombre:** tickets-service

**Descripción:** Microservicio de gestión de tickets para un sistema de arquitectura de microservicios. Gestiona la creación, asignación, edición y cambio de estado de tickets asociados a grupos y usuarios. Utiliza Fastify como framework web y PostgreSQL como base de datos.

**Rutas Base Internas:**

- `/tickets`
- `/health`

### Notas Importantes del Servicio

- Todos los endpoints de `/tickets` requieren autenticación mediante JWT (Bearer token o cookie)
- El servicio utiliza un patrón de respuesta estándar: `{ statusCode, intOpCode, message, data }`
- El campo `data` siempre es un array, incluso para respuestas de un solo elemento
- La autenticación extrae `userId` y `permissions` del JWT
- El SuperAdmin tiene un userId especial: `'00000000-0000-0000-0000-000000000001'`
- Los tickets solo pueden editarse cuando están en estado Open (1)
- Los tickets solo pueden asignarse cuando están en estado Open (1) y no tienen usuario asignado
- Solo el usuario asignado puede iniciar trabajo (cambiar a InProgress) o finalizar (cambiar a Closed)
- Solo el creador o el SuperAdmin pueden editar un ticket
- Solo el owner del grupo o el SuperAdmin pueden asignar tickets

---

## Enums Globales

### TicketStatus

Estados posibles de un ticket

| Key        | Value | Descripción                                                             |
| ---------- | ----- | ----------------------------------------------------------------------- |
| Open       | 1     | Ticket creado y pendiente de asignación o inicio                        |
| InProgress | 2     | Ticket en progreso, siendo trabajado por el usuario asignado            |
| InReview   | 3     | Ticket en revisión (no utilizado actualmente en la lógica del servicio) |
| Closed     | 4     | Ticket finalizado y cerrado                                             |

### TicketPriority

Niveles de prioridad de un ticket

| Key    | Value | Descripción     |
| ------ | ----- | --------------- |
| Low    | 1     | Prioridad baja  |
| Medium | 2     | Prioridad media |
| High   | 3     | Prioridad alta  |

### GroupStatus

Estados de un grupo

| Key      | Value | Descripción    |
| -------- | ----- | -------------- |
| Active   | 1     | Grupo activo   |
| Inactive | 2     | Grupo inactivo |

### UserStatus

Estados de un usuario

| Key      | Value | Descripción      |
| -------- | ----- | ---------------- |
| Active   | 1     | Usuario activo   |
| Inactive | 2     | Usuario inactivo |

### SystemUsers

Usuarios especiales del sistema

| Key          | Value                                | Descripción                           |
| ------------ | ------------------------------------ | ------------------------------------- |
| SuperAdminId | 00000000-0000-0000-0000-000000000001 | ID del superadministrador del sistema |

---

## Permisos Globales

| Permiso                 | Descripción                                                       | Requerido Para                                                                          |
| ----------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| canCreate_Tickets       | Permiso para crear tickets                                        | POST /tickets                                                                           |
| canRead_Tickets         | Permiso para leer tickets                                         | GET /tickets, GET /tickets/pending, GET /tickets/:ticketId, GET /tickets/group/:groupId |
| canUpdate_Tickets       | Permiso para actualizar tickets (edición de campos)               | PATCH /tickets/:ticketId                                                                |
| canDelete_Tickets       | Permiso para eliminar tickets                                     | (No implementado actualmente)                                                           |
| canAssign_Tickets       | Permiso para asignar tickets a usuarios                           | POST /tickets/:ticketId/assign                                                          |
| canUpdateStatus_Tickets | Permiso para actualizar el estado de tickets (start-work, finish) | POST /tickets/:ticketId/start-work, POST /tickets/:ticketId/finish                      |

---

## Tabla Resumen de Endpoints

| Method | Gateway Endpoint                                              | Internal Endpoint             | Auth | Permissions             | Summary                                  |
| ------ | ------------------------------------------------------------- | ----------------------------- | ---- | ----------------------- | ---------------------------------------- |
| GET    | N/A                                                           | /health                       | No   | -                       | Health check del servicio                |
| GET    | https://mi-gateway.onrender.com/tickets/                      | /tickets/                     | Sí   | canRead_Tickets         | Obtener todos los tickets                |
| GET    | https://mi-gateway.onrender.com/tickets/pending               | /tickets/pending              | Sí   | canRead_Tickets         | Obtener tickets pendientes de asignación |
| GET    | https://mi-gateway.onrender.com/tickets/{ticketId}            | /tickets/:ticketId            | Sí   | canRead_Tickets         | Obtener un ticket por ID                 |
| POST   | https://mi-gateway.onrender.com/tickets/                      | /tickets/                     | Sí   | canCreate_Tickets       | Crear un nuevo ticket                    |
| PATCH  | https://mi-gateway.onrender.com/tickets/{ticketId}            | /tickets/:ticketId            | Sí   | canUpdate_Tickets       | Editar un ticket existente               |
| POST   | https://mi-gateway.onrender.com/tickets/{ticketId}/assign     | /tickets/:ticketId/assign     | Sí   | canAssign_Tickets       | Asignar un ticket a un usuario           |
| POST   | https://mi-gateway.onrender.com/tickets/{ticketId}/start-work | /tickets/:ticketId/start-work | Sí   | canUpdateStatus_Tickets | Iniciar trabajo en un ticket             |
| POST   | https://mi-gateway.onrender.com/tickets/{ticketId}/finish     | /tickets/:ticketId/finish     | Sí   | canUpdateStatus_Tickets | Finalizar un ticket                      |
| GET    | https://mi-gateway.onrender.com/groups/{groupId}/tickets      | /tickets/group/:groupId       | Sí   | canRead_Tickets         | Obtener todos los tickets de un grupo    |

---

## Detalle de Endpoints

### GET /health

**Health check del servicio**

**Gateway Endpoint:** N/A (sin mapeo documentado)  
**Internal Endpoint:** `/health`  
**Requiere Autenticación:** No

#### Descripción

Endpoint para verificar que el servicio está activo y funcionando correctamente. No requiere autenticación.

#### Request

- **Headers:** Ninguno requerido
- **Body:** No aplica

#### Responses

##### 200 OK - Servicio saludable

```json
{
  "statusCode": 200,
  "intOpCode": "STKHL200",
  "message": "Tickets service is healthy.",
  "data": []
}
```

**Cuándo ocurre:** Siempre que el servicio esté respondiendo correctamente

#### Lógica de Negocio

- No requiere autenticación
- Siempre retorna 200 si el servicio está levantado

#### Notas para Frontend

- Útil para verificar conectividad con el servicio antes de hacer llamadas autenticadas
- Puede usarse en heartbeat checks o health monitoring

---

### GET /tickets/

**Obtener todos los tickets**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/`  
**Internal Endpoint:** `/tickets/`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canRead_Tickets`

#### Descripción

Recupera una lista completa de todos los tickets del sistema con información completa incluyendo grupo, usuario creador y usuario asignado.

#### Request

- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No aplica

#### Responses

##### 200 OK - Tickets recuperados exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKRD200",
  "message": "Tickets retrieved successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Fix login bug",
      "description": "Users cannot log in with their credentials",
      "comments": "Checked database connections",
      "status": 1,
      "priority": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:22:00Z",
      "dueDate": "2024-01-20T23:59:59Z",
      "groupId": "660e8400-e29b-41d4-a716-446655440000",
      "groupName": "Backend Team",
      "createdByUserId": "770e8400-e29b-41d4-a716-446655440000",
      "createdByUserName": "John Doe",
      "assignedUserId": "880e8400-e29b-41d4-a716-446655440000",
      "assignedUserName": "Jane Smith"
    }
  ]
}
```

**Cuándo ocurre:** Cuando se recuperan exitosamente todos los tickets

##### 401 Unauthorized - Token inválido o faltante

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT o el token es inválido

##### 403 Forbidden - Sin permiso

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You do not have permission to read tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario autenticado no tiene el permiso 'canRead_Tickets'

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while retrieving tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- Retorna todos los tickets del sistema sin filtrado
- Incluye tickets de todos los grupos y todos los estados
- Los tickets se ordenan por fecha de creación descendente (más recientes primero)
- Incluye información completa del ticket con datos relacionados (grupo, usuario creador, usuario asignado)

#### Notas para Frontend

- Ideal para mostrar una tabla o lista completa de todos los tickets
- El campo `data` siempre es un array, puede estar vacío si no hay tickets
- Los campos `assignedUserId` y `assignedUserName` pueden ser null si el ticket no está asignado
- El campo `comments` puede ser null
- Los valores de `status` y `priority` son numéricos, usar los enums globales para mapear a labels
- Las fechas están en formato ISO 8601 string

---

### GET /tickets/pending

**Obtener tickets pendientes de asignación**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/pending`  
**Internal Endpoint:** `/tickets/pending`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canRead_Tickets`

#### Descripción

Recupera tickets que están en estado Open (1) y no tienen usuario asignado. Si el usuario es SuperAdmin, retorna todos los tickets pendientes del sistema. Si es un usuario regular, solo retorna los tickets pendientes de grupos donde el usuario es owner.

#### Reglas de Ownership

- Si `userId === '00000000-0000-0000-0000-000000000001'` (SuperAdmin): retorna TODOS los tickets pendientes del sistema
- Si `userId !== SuperAdmin`: retorna solo tickets pendientes de grupos donde el usuario es `created_by_user_id` (owner del grupo)

#### Request

- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No aplica

#### Responses

##### 200 OK - Tickets pendientes recuperados exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKRD200",
  "message": "Pending tickets retrieved successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "New feature request",
      "description": "Implement user dashboard",
      "comments": null,
      "status": 1,
      "priority": 2,
      "createdAt": "2024-01-16T09:00:00Z",
      "updatedAt": "2024-01-16T09:00:00Z",
      "dueDate": "2024-01-25T23:59:59Z",
      "groupId": "660e8400-e29b-41d4-a716-446655440000",
      "groupName": "Frontend Team",
      "createdByUserId": "770e8400-e29b-41d4-a716-446655440000",
      "createdByUserName": "John Doe",
      "assignedUserId": null,
      "assignedUserName": null
    }
  ]
}
```

**Cuándo ocurre:** Cuando se recuperan exitosamente los tickets pendientes filtrados por rol del usuario

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin permiso

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You do not have permission to read pending tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario autenticado no tiene el permiso 'canRead_Tickets'

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while retrieving pending tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- Ticket pendiente = `status === 1 (Open)` AND `assigned_user_id IS NULL`
- SuperAdmin (`userId === '00000000-0000-0000-0000-000000000001'`) ve TODOS los tickets pendientes
- Usuario regular ve solo tickets pendientes de grupos donde es owner (`group.created_by_user_id === userId`)
- Los tickets se ordenan por fecha de creación descendente (más recientes primero)
- `assignedUserId` y `assignedUserName` siempre serán null en esta respuesta por definición de 'pending'

#### Notas para Frontend

- Útil para mostrar una cola de tickets pendientes de asignación
- Los group owners solo ven tickets de SUS grupos, el SuperAdmin ve todo
- `assignedUserId` y `assignedUserName` siempre null en esta respuesta
- Ideal para una vista de 'Asignar Tickets' o 'Tickets sin Asignar'
- El array puede estar vacío si no hay tickets pendientes según el filtro de rol

---

### GET /tickets/{ticketId}

**Obtener un ticket por ID**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/{ticketId}`  
**Internal Endpoint:** `/tickets/:ticketId`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canRead_Tickets`

#### Descripción

Recupera la información completa de un ticket específico identificado por su ID UUID.

#### Request

- **Route Params:**
  - `ticketId` (string UUID, requerido) - ID único del ticket a recuperar
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No aplica

#### Responses

##### 200 OK - Ticket recuperado exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKRD200",
  "message": "Ticket retrieved successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Fix login bug",
      "description": "Users cannot log in with their credentials",
      "comments": "Checked database connections",
      "status": 2,
      "priority": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T08:15:00Z",
      "dueDate": "2024-01-20T23:59:59Z",
      "groupId": "660e8400-e29b-41d4-a716-446655440000",
      "groupName": "Backend Team",
      "createdByUserId": "770e8400-e29b-41d4-a716-446655440000",
      "createdByUserName": "John Doe",
      "assignedUserId": "880e8400-e29b-41d4-a716-446655440000",
      "assignedUserName": "Jane Smith"
    }
  ]
}
```

**Cuándo ocurre:** Cuando se encuentra y recupera exitosamente el ticket por su ID

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT o el token es inválido

##### 403 Forbidden - Sin permiso

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You do not have permission to read tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario autenticado no tiene el permiso 'canRead_Tickets'

##### 404 Not Found - Ticket no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified ticket was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe un ticket con el ticketId proporcionado

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while retrieving the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- Retorna un solo ticket identificado por UUID
- Incluye información completa del ticket con datos relacionados (grupo, usuario creador, usuario asignado)
- No aplica filtros de ownership, cualquier usuario con permiso canRead_Tickets puede ver cualquier ticket
- El ticket puede estar en cualquier estado

#### Notas para Frontend

- Ideal para mostrar un modal de detalle o página de detalle de un ticket específico
- El campo `data` es un array con un solo elemento cuando el ticket existe
- Manejar el 404 para mostrar mensaje 'Ticket no encontrado'
- Los campos `assignedUserId` y `assignedUserName` pueden ser null si el ticket no está asignado
- El campo `comments` puede ser null

---

### POST /tickets/

**Crear un nuevo ticket**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/`  
**Internal Endpoint:** `/tickets/`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canCreate_Tickets`

#### Descripción

Crea un nuevo ticket asociado a un grupo específico. El ticket se crea con estado Open (1) y sin usuario asignado inicialmente. El userId del JWT se asigna como created_by_user_id del ticket.

#### Request

- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
  - `Content-Type: application/json` (requerido)
- **Body Schema:**

```json
{
  "title": "string (1-200 chars, required)",
  "description": "string (1-4000 chars, required)",
  "comments": "string (max 4000 chars, optional)",
  "priority": "enum: 'Low' | 'Medium' | 'High' (required)",
  "dueDate": "string ISO 8601 datetime (optional)",
  "groupId": "string UUID (required)"
}
```

- **Body Example:**

```json
{
  "title": "Implementar autenticación de dos factores",
  "description": "Añadir soporte para autenticación 2FA en el sistema de login para mejorar la seguridad de las cuentas de usuario",
  "comments": "Priorizar integración con Google Authenticator",
  "priority": "High",
  "dueDate": "2024-02-01T23:59:59Z",
  "groupId": "660e8400-e29b-41d4-a716-446655440000"
}
```

#### Validación

- `title`: string no vacío (después de trim), máximo 200 caracteres
- `description`: string no vacío (después de trim), máximo 4000 caracteres
- `comments`: string opcional, máximo 4000 caracteres (se aplica trim)
- `priority`: debe ser exactamente 'Low', 'Medium', o 'High' (case-sensitive)
- `dueDate`: opcional, debe ser string en formato ISO 8601 datetime si se proporciona
- `groupId`: debe ser UUID válido

#### Responses

##### 201 Created - Ticket creado exitosamente

```json
{
  "statusCode": 201,
  "intOpCode": "STKCR201",
  "message": "Ticket created successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Cuándo ocurre:** Cuando el ticket se crea exitosamente en la base de datos

##### 400 Bad Request - Payload inválido

```json
{
  "statusCode": 400,
  "intOpCode": "ETKBR400",
  "message": "Invalid request payload.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el body no cumple con el schema de validación de Zod

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin permiso

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You do not have permission to create tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario autenticado no tiene el permiso 'canCreate_Tickets'

##### 404 Not Found - Grupo no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified group was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el groupId proporcionado no existe en la base de datos

##### 409 Conflict - Grupo inactivo

```json
{
  "statusCode": 409,
  "intOpCode": "ETKCF409",
  "message": "The specified group is inactive.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el grupo existe pero su status !== 1 (Active)

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while creating the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- El ticket se crea con `status = 1 (Open)` automáticamente
- El ticket se crea con `assigned_user_id = null` (sin asignar)
- El `created_by_user_id` se toma del userId del JWT
- El `groupId` debe existir en la base de datos
- El grupo debe tener `status = 1 (Active)`, si no retorna 409 Conflict
- El campo priority se convierte de string ('Low'/'Medium'/'High') a número (1/2/3) internamente
- Se genera un UUID aleatorio para el id del ticket
- `created_at` y `updated_at` se establecen a NOW() en el momento de inserción

#### Notas para Frontend

- Tras crear el ticket, la respuesta incluye el ID generado en `data[0].id`
- Usar ese ID para redireccionar al detalle del ticket recién creado
- Mostrar mensaje de éxito 'Ticket creado exitosamente'
- Validar el formulario en frontend para coincidir con las reglas de Zod (ahorra requests 400)
- El campo `priority` debe enviarse como string literal: 'Low', 'Medium', o 'High'
- El campo `dueDate` debe enviarse en formato ISO 8601 si se incluye
- Manejar 404 para mostrar 'Grupo no encontrado'
- Manejar 409 para mostrar 'No se puede crear ticket en un grupo inactivo'

---

### PATCH /tickets/{ticketId}

**Editar un ticket existente**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/{ticketId}`  
**Internal Endpoint:** `/tickets/:ticketId`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canUpdate_Tickets`

#### Descripción

Actualiza uno o más campos de un ticket existente. Solo puede editar el creador del ticket o el SuperAdmin. Solo se pueden editar tickets en estado Open (1).

#### Reglas de Ownership

- Solo el creador del ticket (`created_by_user_id === userId`) puede editar
- O el SuperAdmin (`userId === '00000000-0000-0000-0000-000000000001'`) puede editar cualquier ticket
- Si no cumple, retorna 403 Forbidden

#### Request

- **Route Params:**
  - `ticketId` (string UUID, requerido) - ID único del ticket a editar
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
  - `Content-Type: application/json` (requerido)
- **Body Schema:**

```json
{
  "title": "string (1-200 chars, optional)",
  "description": "string (1-4000 chars, optional)",
  "comments": "string | null (max 4000 chars, optional)",
  "priority": "enum: 'Low' | 'Medium' | 'High' (optional)",
  "dueDate": "string ISO 8601 datetime | null (optional)"
}
```

**Nota:** Al menos un campo debe proporcionarse

- **Body Example:**

```json
{
  "title": "Implementar autenticación de dos factores (ACTUALIZADO)",
  "priority": "Medium",
  "comments": "Se redujo prioridad tras análisis de riesgos"
}
```

#### Validación

- Al menos un campo debe proporcionarse en el body (Zod refinement)
- `title`: opcional, string no vacío (después de trim) si se proporciona, máximo 200 caracteres
- `description`: opcional, string no vacío (después de trim) si se proporciona, máximo 4000 caracteres
- `comments`: opcional, string máximo 4000 caracteres o null explícito para limpiar
- `priority`: opcional, debe ser 'Low', 'Medium', o 'High' si se proporciona
- `dueDate`: opcional, string en formato ISO 8601 datetime o null explícito para limpiar

#### Responses

##### 200 OK - Ticket actualizado exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKUP200",
  "message": "Ticket updated successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Cuándo ocurre:** Cuando el ticket se actualiza exitosamente

##### 400 Bad Request - Payload inválido

```json
{
  "statusCode": 400,
  "intOpCode": "ETKBR400",
  "message": "Invalid request payload.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el body no cumple con el schema de validación (no se proporciona ningún campo o formato inválido)

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin autorización

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You are not authorized to edit this ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario no tiene permiso 'canUpdate_Tickets' O cuando no es el creador ni el SuperAdmin

##### 404 Not Found - Ticket no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified ticket was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe un ticket con el ticketId proporcionado

##### 409 Conflict - Ticket no editable

```json
{
  "statusCode": 409,
  "intOpCode": "ETKCF409",
  "message": "The ticket cannot be edited because it is not open.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el ticket existe pero su status !== 1 (Open)

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while updating the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- Solo se pueden editar tickets con `status = 1 (Open)`
- Solo el creador del ticket o el SuperAdmin pueden editar
- Se actualiza `updated_at` a NOW() automáticamente
- Los campos no proporcionados NO se modifican (actualización parcial)
- El campo priority se convierte de string a número internamente si se proporciona
- Si `comments` o `dueDate` se envían como null explícitamente, se limpian en la BD

#### Notas para Frontend

- Solo mostrar opción de editar si el usuario es el creador o SuperAdmin
- Deshabilitar edición si el ticket NO está en estado Open (status !== 1)
- Mostrar mensaje claro si se intenta editar un ticket en otro estado: 'Solo se pueden editar tickets en estado Abierto'
- Enviar solo los campos que realmente cambiaron (optimización)
- Para limpiar `comments` o `dueDate`, enviar explícitamente null
- Tras actualizar, refrescar la vista de detalle del ticket
- Manejar 403 'not authorized' vs 'no permission' para mensajes diferenciados

---

### POST /tickets/{ticketId}/assign

**Asignar un ticket a un usuario**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/{ticketId}/assign`  
**Internal Endpoint:** `/tickets/:ticketId/assign`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canAssign_Tickets`

#### Descripción

Asigna un ticket a un usuario específico del grupo. Solo puede asignar el owner del grupo o el SuperAdmin. El ticket debe estar en estado Open y no tener usuario asignado. El usuario asignado debe ser miembro activo del grupo.

#### Reglas de Ownership

- Solo el owner del grupo (`group.created_by_user_id === userId`) puede asignar tickets de ese grupo
- O el SuperAdmin (`userId === '00000000-0000-0000-0000-000000000001'`) puede asignar cualquier ticket
- Si no cumple, retorna 403 Forbidden

#### Request

- **Route Params:**
  - `ticketId` (string UUID, requerido) - ID único del ticket a asignar
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
  - `Content-Type: application/json` (requerido)
- **Body Schema:**

```json
{
  "assignedUserId": "string UUID (required)"
}
```

- **Body Example:**

```json
{
  "assignedUserId": "880e8400-e29b-41d4-a716-446655440000"
}
```

#### Responses

##### 200 OK - Ticket asignado exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKAS200",
  "message": "Ticket assigned successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Cuándo ocurre:** Cuando el ticket se asigna exitosamente al usuario

##### 400 Bad Request - Payload inválido

```json
{
  "statusCode": 400,
  "intOpCode": "ETKBR400",
  "message": "Invalid request payload.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el body no cumple con el schema de validación (assignedUserId no es UUID válido)

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin autorización

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You are not authorized to assign this ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario no tiene permiso 'canAssign_Tickets' O cuando no es el owner del grupo ni el SuperAdmin

##### 404 Not Found - Recurso no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified assigned user was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe el ticket, el grupo, o el usuario a asignar

##### 409 Conflict - Conflicto de estado

```json
{
  "statusCode": 409,
  "intOpCode": "ETKCF409",
  "message": "The ticket is already assigned.",
  "data": []
}
```

**Cuándo ocurre:** Cuando hay un conflicto: ticket ya asignado, ticket no Open, grupo inactivo, usuario inactivo, o usuario no es miembro del grupo

Mensajes posibles de 409:

- "The ticket is already assigned."
- "The ticket is not open."
- "The specified group is inactive."
- "The specified assigned user is inactive."
- "The specified assigned user does not belong to the group."

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while assigning the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- El ticket debe estar en `status = 1 (Open)`, si no retorna 409
- El ticket NO debe tener `assigned_user_id`, si ya está asignado retorna 409
- Solo el owner del grupo o SuperAdmin pueden asignar
- El grupo debe existir y tener `status = 1 (Active)`
- El usuario a asignar debe existir, si no retorna 404
- El usuario a asignar debe tener `status = 1 (Active)`, si no retorna 409
- El usuario a asignar DEBE ser miembro del grupo (verificado en tabla `group_members`), si no retorna 409
- Se actualiza `assigned_user_id` y `updated_at` del ticket

#### Notas para Frontend

- Solo mostrar opción de asignar si el usuario es owner del grupo o SuperAdmin
- Deshabilitar asignación si el ticket NO está en estado Open o ya está asignado
- Mostrar lista de usuarios del grupo para seleccionar (solo miembros activos)
- Manejar múltiples mensajes 409 diferentes para dar feedback específico al usuario
- Tras asignar, refrescar la vista de tickets pendientes y/o detalle del ticket
- Mostrar mensaje de éxito 'Ticket asignado exitosamente a [nombre del usuario]'

---

### POST /tickets/{ticketId}/start-work

**Iniciar trabajo en un ticket**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/{ticketId}/start-work`  
**Internal Endpoint:** `/tickets/:ticketId/start-work`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canUpdateStatus_Tickets`

#### Descripción

Cambia el estado de un ticket de Open (1) a InProgress (2). Solo puede iniciar trabajo el usuario asignado al ticket.

#### Reglas de Ownership

- Solo el usuario asignado al ticket (`assigned_user_id === userId`) puede iniciar trabajo
- Si no es el usuario asignado, retorna 403 Forbidden

#### Request

- **Route Params:**
  - `ticketId` (string UUID, requerido) - ID único del ticket en el que se iniciará trabajo
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No requiere body

#### Responses

##### 200 OK - Trabajo iniciado exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKSW200",
  "message": "Work started successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Cuándo ocurre:** Cuando el estado del ticket se cambia exitosamente a InProgress (2)

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin autorización

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You are not authorized to start work on this ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario no tiene permiso 'canUpdateStatus_Tickets' O cuando no es el usuario asignado al ticket

##### 404 Not Found - Ticket no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified ticket was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe un ticket con el ticketId proporcionado

##### 409 Conflict - Conflicto de estado

```json
{
  "statusCode": 409,
  "intOpCode": "ETKCF409",
  "message": "The ticket cannot start work because it is not open.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el ticket no tiene assigned_user_id O cuando el ticket status !== 1 (Open)

Mensajes posibles de 409:

- "The ticket has no assigned user."
- "The ticket cannot start work because it is not open."

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while starting work on the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- El ticket DEBE tener `assigned_user_id` (no puede ser null), si no retorna 409
- Solo el usuario asignado puede iniciar trabajo (`assigned_user_id === userId` del JWT)
- El ticket debe estar en `status = 1 (Open)`, si no retorna 409
- Se actualiza `status` a 2 (InProgress) y `updated_at` a NOW()
- No requiere body en el request

#### Notas para Frontend

- Solo mostrar botón 'Iniciar Trabajo' si el ticket está asignado al usuario logueado
- Deshabilitar si el ticket NO está en estado Open (status !== 1)
- No requiere formulario, solo un botón de acción
- Tras iniciar trabajo, actualizar el estado visual del ticket a 'En Progreso'
- Mostrar mensaje de éxito 'Trabajo iniciado exitosamente'
- Manejar 409 para mostrar mensajes específicos según el motivo del conflicto

---

### POST /tickets/{ticketId}/finish

**Finalizar un ticket**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/tickets/{ticketId}/finish`  
**Internal Endpoint:** `/tickets/:ticketId/finish`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canUpdateStatus_Tickets`

#### Descripción

Cambia el estado de un ticket de InProgress (2) a Closed (4). Solo puede finalizar el usuario asignado al ticket.

#### Reglas de Ownership

- Solo el usuario asignado al ticket (`assigned_user_id === userId`) puede finalizar
- Si no es el usuario asignado, retorna 403 Forbidden

#### Request

- **Route Params:**
  - `ticketId` (string UUID, requerido) - ID único del ticket a finalizar
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No requiere body

#### Responses

##### 200 OK - Ticket finalizado exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKFN200",
  "message": "Ticket finished successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}
```

**Cuándo ocurre:** Cuando el estado del ticket se cambia exitosamente a Closed (4)

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT, el token es inválido, o no contiene userId válido

##### 403 Forbidden - Sin autorización

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You are not authorized to finish this ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario no tiene permiso 'canUpdateStatus_Tickets' O cuando no es el usuario asignado al ticket

##### 404 Not Found - Ticket no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified ticket was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe un ticket con el ticketId proporcionado

##### 409 Conflict - Conflicto de estado

```json
{
  "statusCode": 409,
  "intOpCode": "ETKCF409",
  "message": "The ticket cannot be finished because it is not in progress.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el ticket no tiene assigned_user_id O cuando el ticket status !== 2 (InProgress)

Mensajes posibles de 409:

- "The ticket has no assigned user."
- "The ticket cannot be finished because it is not in progress."

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while finishing the ticket.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- El ticket DEBE tener `assigned_user_id` (no puede ser null), si no retorna 409
- Solo el usuario asignado puede finalizar (`assigned_user_id === userId` del JWT)
- El ticket debe estar en `status = 2 (InProgress)`, si no retorna 409
- Se actualiza `status` a 4 (Closed) y `updated_at` a NOW()
- No requiere body en el request

#### Notas para Frontend

- Solo mostrar botón 'Finalizar Ticket' si el ticket está asignado al usuario logueado
- Deshabilitar si el ticket NO está en estado InProgress (status !== 2)
- No requiere formulario, solo un botón de acción (puede requerir confirmación)
- Tras finalizar, actualizar el estado visual del ticket a 'Cerrado'
- Mostrar mensaje de éxito 'Ticket finalizado exitosamente'
- Manejar 409 para mostrar mensajes específicos según el motivo del conflicto
- Considerar mostrar confirmación antes de finalizar: '¿Está seguro de que desea cerrar este ticket?'

---

### GET /groups/{groupId}/tickets

**Obtener todos los tickets de un grupo**

**Gateway Endpoint:** `https://mi-gateway.onrender.com/groups/{groupId}/tickets`  
**Internal Endpoint:** `/tickets/group/:groupId`  
**Requiere Autenticación:** Sí  
**Permisos Requeridos:** `canRead_Tickets`

#### Descripción

Recupera todos los tickets asociados a un grupo específico, independientemente de su estado. Incluye información completa del ticket con datos relacionados.

#### Request

- **Route Params:**
  - `groupId` (string UUID, requerido) - ID único del grupo cuyos tickets se desean obtener
- **Headers:**
  - `Authorization: Bearer <token>` (requerido)
- **Body:** No aplica

#### Responses

##### 200 OK - Tickets del grupo recuperados exitosamente

```json
{
  "statusCode": 200,
  "intOpCode": "STKRD200",
  "message": "Group tickets retrieved successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Fix login bug",
      "description": "Users cannot log in with their credentials",
      "comments": "Checked database connections",
      "status": 2,
      "priority": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T08:15:00Z",
      "dueDate": "2024-01-20T23:59:59Z",
      "groupId": "660e8400-e29b-41d4-a716-446655440000",
      "groupName": "Backend Team",
      "createdByUserId": "770e8400-e29b-41d4-a716-446655440000",
      "createdByUserName": "John Doe",
      "assignedUserId": "880e8400-e29b-41d4-a716-446655440000",
      "assignedUserName": "Jane Smith"
    }
  ]
}
```

**Cuándo ocurre:** Cuando se recuperan exitosamente los tickets del grupo

##### 401 Unauthorized - Token inválido

```json
{
  "statusCode": 401,
  "intOpCode": "ETKAU401",
  "message": "Invalid authentication token.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no se proporciona token JWT o el token es inválido

##### 403 Forbidden - Sin permiso

```json
{
  "statusCode": 403,
  "intOpCode": "ETKFB403",
  "message": "You do not have permission to read tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando el usuario autenticado no tiene el permiso 'canRead_Tickets'

##### 404 Not Found - Grupo no encontrado

```json
{
  "statusCode": 404,
  "intOpCode": "ETKNF404",
  "message": "The specified group was not found.",
  "data": []
}
```

**Cuándo ocurre:** Cuando no existe un grupo con el groupId proporcionado

##### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "intOpCode": "ETKIN500",
  "message": "An unexpected error occurred while retrieving group tickets.",
  "data": []
}
```

**Cuándo ocurre:** Cuando ocurre un error inesperado en el servicio o base de datos

#### Lógica de Negocio

- Primero verifica que el grupo exista, si no retorna 404
- Retorna todos los tickets del grupo sin filtrar por estado
- Los tickets se ordenan por fecha de creación descendente (más recientes primero)
- Incluye información completa del ticket con datos relacionados (grupo, usuario creador, usuario asignado)
- No aplica filtros de ownership, cualquier usuario con permiso canRead_Tickets puede ver tickets de cualquier grupo

#### Notas para Frontend

- Útil para mostrar una vista de tickets filtrada por grupo
- El array puede estar vacío si el grupo no tiene tickets
- Ideal para una página de detalle de grupo que liste todos sus tickets
- Manejar 404 para mostrar 'Grupo no encontrado'
- Los campos `assignedUserId` y `assignedUserName` pueden ser null si el ticket no está asignado
- El campo `comments` puede ser null
- Usar los enums globales para mapear status y priority a labels legibles

#### Observación

**Inconsistencia de ruta detectada:** El comentario 'Corresponde a:' indica ruta del gateway `/groups/{groupId}/tickets` pero la ruta interna del servicio es `/tickets/group/:groupId`. Esto indica que el API Gateway hace un mapeo/reescritura de ruta. El frontend debe llamar a `/groups/{groupId}/tickets` en el gateway.

---

## Inconsistencias Detectadas

### 1. Route Mismatch - GET /groups/{groupId}/tickets

**Severidad:** Info  
**Endpoint Afectado:** get-tickets-by-group

**Descripción:** El comentario 'Corresponde a:' indica ruta del gateway `https://mi-gateway.onrender.com/groups/{groupId}/tickets` pero la ruta interna del servicio es `/tickets/group/:groupId`. Esto indica que el API Gateway hace un mapeo/reescritura de ruta.

**Gateway Endpoint:** `https://mi-gateway.onrender.com/groups/{groupId}/tickets`  
**Internal Endpoint:** `/tickets/group/:groupId`

**Recomendación:** El frontend debe llamar a `/groups/{groupId}/tickets` en el gateway. El gateway se encargará de redirigir a `/tickets/group/{groupId}` en el microservicio.

---

### 2. Missing Gateway Mapping - GET /health

**Severidad:** Medium  
**Endpoint Afectado:** health-check

**Descripción:** El endpoint `/health` no tiene comentario 'Corresponde a:' que indique su mapeo en el API Gateway.

**Internal Endpoint:** `/health`  
**Gateway Endpoint:** null

**Recomendación:** Verificar si existe un endpoint de health check en el API Gateway o si este endpoint solo es accesible internamente.

---

### 3. OpCode Duplicate - ReadOk vs ReadOneOk

**Severidad:** Low  
**Endpoints Afectados:** get-all-tickets, get-ticket-by-id, get-pending-tickets, get-tickets-by-group

**Descripción:** Los opcodes 'ReadOk' y 'ReadOneOk' mapean al mismo valor 'STKRD200'.

**Recomendación:** Considerar usar opcodes distintos para diferenciar entre 'leer lista' vs 'leer uno' si se desea mayor granularidad en el tracking de operaciones.

---

## Información de Tipo de Datos

### TicketListItemDto

Estructura completa de un ticket con información relacionada

```typescript
{
  id: string; // UUID del ticket
  title: string; // Título del ticket
  description: string; // Descripción del ticket
  comments: string | null; // Comentarios adicionales (puede ser null)
  status: number; // Estado: 1=Open, 2=InProgress, 3=InReview, 4=Closed
  priority: number; // Prioridad: 1=Low, 2=Medium, 3=High
  createdAt: string; // Fecha de creación (ISO 8601)
  updatedAt: string; // Fecha de última actualización (ISO 8601)
  dueDate: string | null; // Fecha límite (ISO 8601, puede ser null)
  groupId: string; // UUID del grupo
  groupName: string; // Nombre del grupo
  createdByUserId: string; // UUID del usuario creador
  createdByUserName: string; // Nombre completo del usuario creador
  assignedUserId: string | null; // UUID del usuario asignado (null si no asignado)
  assignedUserName: string | null; // Nombre del usuario asignado (null si no asignado)
}
```

---

## Resumen de Códigos de Operación (OpCodes)

### Códigos de Éxito

- `STKHL200` - Health check OK
- `STKRD200` - Read OK (lista o un elemento)
- `STKCR201` - Create OK
- `STKUP200` - Update OK
- `STKAS200` - Assign OK
- `STKSW200` - Start Work OK
- `STKFN200` - Finish OK

### Códigos de Error

- `ETKAU401` - Unauthorized (token faltante o inválido)
- `ETKFB403` - Forbidden (sin permiso o sin autorización)
- `ETKNF404` - Not Found (recurso no encontrado)
- `ETKCF409` - Conflict (conflicto de estado)
- `ETKBR400` - Bad Request (payload inválido)
- `ETKIN500` - Internal Server Error (error inesperado)

---

## Notas Finales para Frontend

### Autenticación

- Todos los endpoints excepto `/health` requieren JWT
- El token puede enviarse en header `Authorization: Bearer <token>` o en cookie `jwt`
- El JWT debe contener `userId` y `permissions`
- El token se valida con issuer y audience configurados en el servicio

### Manejo de Respuestas

- Todas las respuestas siguen el formato: `{ statusCode, intOpCode, message, data }`
- `data` siempre es un array, incluso para respuestas de un solo elemento
- Para endpoints que retornan un elemento, acceder como `data[0]`
- En caso de error, `data` es un array vacío `[]`

### Manejo de Estados de Ticket

- Open (1): Puede ser asignado, editado
- InProgress (2): Puede ser finalizado
- Closed (4): Estado final, no se puede modificar
- InReview (3): No utilizado actualmente

### Roles Especiales

- SuperAdmin (`00000000-0000-0000-0000-000000000001`): Puede editar cualquier ticket, ver todos los tickets pendientes, asignar cualquier ticket
- Group Owner: Puede asignar tickets de sus grupos, ver tickets pendientes de sus grupos
- Ticket Creator: Puede editar sus tickets (si están en Open)
- Assigned User: Puede iniciar trabajo y finalizar ticket

### Validaciones Importantes

- Usar enums exactos para `priority`: 'Low', 'Medium', 'High' (case-sensitive)
- Las fechas deben estar en formato ISO 8601
- Los UUIDs deben ser válidos
- Validar en frontend para reducir errores 400

### Mensajes al Usuario

- Diferenciar entre errores de permiso (403) y errores de autorización (403 con mensaje diferente)
- Manejar múltiples variantes de 409 Conflict con mensajes específicos
- Mostrar confirmaciones antes de acciones irreversibles (finalizar ticket)
