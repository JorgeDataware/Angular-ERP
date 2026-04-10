# AGENT_GUIDE_tickets.md — Tickets Module (FASE 4)

## Status: COMPLETED

## Overview

The Tickets module was migrated from 100% in-memory/hardcoded mock data to consume the API Gateway exclusively. The backend uses a workflow-based model (create → assign → start-work → finish) rather than free-form status updates.

## Key Backend Differences

### Status Model: 3 statuses (not 4)
| Backend Status | Numeric | Spanish Label | Old Frontend Status |
|---|---|---|---|
| Open | 1 | Abierto | pendiente |
| InProgress | 2 | En progreso | en progreso |
| Closed | 3 | Cerrado | finalizado |
| *(removed)* | - | - | en revision |

### Priority Model: Numeric in response, string in payloads
| Backend Priority | Numeric (response) | Payload String (create/edit) | Spanish Label |
|---|---|---|---|
| Low | 1 | "Low" | Baja |
| Medium | 2 | "Medium" | Media |
| High | 3 | "High" | Alta |

### Workflow Endpoints (not just PATCH)
| Action | Endpoint | Who Can Do It | Preconditions |
|---|---|---|---|
| Create | `POST /tickets` | `canCreate_Tickets` | - |
| Edit | `PATCH /tickets/:ticketId` | `canUpdate_Tickets` | Only creator, only Open tickets |
| Assign | `POST /tickets/:ticketId/assign` | `canAssign_Tickets` | Only group owner/superadmin, Open & unassigned |
| Start Work | `POST /tickets/:ticketId/start-work` | `canUpdateStatus_Tickets` | Only assigned user, Open→InProgress |
| Finish | `POST /tickets/:ticketId/finish` | `canUpdateStatus_Tickets` | Only assigned user, InProgress→Closed |
| List All | `GET /tickets` | `canRead_Tickets` | - |
| List Pending | `GET /tickets/pending` | `canRead_Tickets` | Regular users see only from groups they own |
| Get Detail | `GET /tickets/:ticketId` | `canRead_Tickets` | - |

### Comments: Single string (not array)
- Backend `comments` is a `string | null`, NOT an array of comment objects
- The old frontend had `comentarios: TicketComment[]` — this was frontend-only
- Change history (`historialCambios`) was also frontend-only — removed from UI

### Special Permissions
- `canAssign_Tickets` — checked via `authService.hasRawPermission('canAssign_Tickets')`
- `canUpdateStatus_Tickets` — checked via `authService.hasRawPermission('canUpdateStatus_Tickets')`
- These do NOT map through the standard `hasPermission(module, action)` system

### No Delete Endpoint
- Backend has no `DELETE /tickets/:ticketId` endpoint
- The `confirmDelete` method and delete button were removed from the UI

## Files Modified

### Model
- **`src/app/core/models/ticket.ts`**
  - Preserved all legacy types: `Ticket`, `TicketStatus`, `TicketPriority`, `TicketComment`, `TicketChange`
  - Added: `TicketStatusBackend` (1|2|3), `TicketPriorityBackend` (1|2|3), `TicketPriorityPayload`, `TicketBackend`, `CreateTicketPayload`, `UpdateTicketPayload`, `AssignTicketPayload`, `TagSeverity`
  - Added mapping constants: `TICKET_STATUS_LABELS`, `TICKET_STATUS_SEVERITY`, `TICKET_PRIORITY_LABELS`, `TICKET_PRIORITY_SEVERITY`, `TICKET_PRIORITY_TO_PAYLOAD`, `TICKET_PRIORITY_FROM_PAYLOAD`, `TICKET_STATUS_OPTIONS`, `TICKET_PRIORITY_OPTIONS`, `TICKET_PRIORITY_FORM_OPTIONS`

### Service
- **`src/app/core/services/ticket.service.ts`**
  - Full rewrite from in-memory to HTTP
  - Signals: `tickets` (TicketBackend[]), `pendingTickets` (TicketBackend[]), `loading`
  - Read methods: `loadTickets()`, `loadPendingTickets()`, `getTicketById()`
  - Write methods: `createTicket()`, `updateTicket()`
  - Workflow methods: `assignTicket()`, `startWork()`, `finishTicket()`
  - All methods auto-refresh the `tickets` signal after mutations
  - Legacy data preserved as `LEGACY_TICKETS` constant and `getLegacyTickets()`, `getLegacyTicketsByGroup()` methods

### Tickets Page
- **`src/app/pages/tickets/tickets.ts`**
  - Adapted to `TicketBackend`, async HTTP operations
  - `groupId` is now `string | null` (UUID)
  - 3 kanban columns instead of 4
  - Drag & drop calls workflow endpoints (start-work, finish) instead of generic update
  - Only allows valid transitions: Open→InProgress, InProgress→Closed
  - Create form: title, description, priority (dropdown), groupId (dropdown), comments (optional), dueDate (optional)
  - Edit form: title, description, comments, priority, dueDate — only for Open tickets
  - Assign dialog: fetches group members, dropdown to select user
  - Workflow buttons: Assign (Open+unassigned), Start Work (Open+assigned), Finish (InProgress)
  - Removed: delete functionality, estado field on forms, asignadoA on forms, change history, comment array
  - Permissions: `canCreate` (hasPermission), `canEdit` (hasPermission), `canAssign` (hasRawPermission), `canUpdateStatus` (hasRawPermission)
  - Removed `HasPermissionDirective` import — uses `@if` with computed permission signals

- **`src/app/pages/tickets/tickets.html`**
  - Table columns: Title, Estado (tag), Asignado a, Prioridad (tag), Grupo, Creacion, Limite, Acciones
  - Action buttons per row: View, Edit (if Open), Assign (if Open+unassigned), Start Work (if Open+assigned), Finish (if InProgress)
  - Kanban: 3 columns (Abierto, En progreso, Cerrado)
  - Detail dialog: title, status/priority tags, createdByUserName, assignedUserName, groupName, createdAt, updatedAt, dueDate, description, comments (single text), workflow action buttons
  - Create/Edit dialog: simplified form
  - Assign dialog: member dropdown from group service

- **`src/app/pages/tickets/tickets.css`**
  - Kanban grid changed from `repeat(4, 1fr)` to `repeat(3, 1fr)`
  - Kanban header classes: `kanban-header-open`, `kanban-header-in-progress`, `kanban-header-closed`
  - Added: `.detail-actions-row`, `.detail-comments-text`, `.assign-dialog-content`
  - Removed: old history/comment CSS (preserved only `.no-data`)

### Ticket Dashboard
- **`src/app/pages/ticket-dashboard/ticket-dashboard.ts`**
  - Adapted to `TicketBackend`, async HTTP loading
  - `groupId` is now `string | null` (UUID)
  - Summary cards: Total, Abiertos (status=1), En progreso (status=2), Cerrados (status=3), Prioridad alta (priority=3)
  - Removed "En revision" card
  - Filters adapted to backend field names and numeric types
  - Group filter uses `groupName` from ticket data
  - Assigned user filter built from ticket data (unique assignedUserName values)

- **`src/app/pages/ticket-dashboard/ticket-dashboard.html`**
  - Summary cards: 5 (was 6 — removed "En revision")
  - Table columns: Title, Estado, Asignado a, Prioridad, Grupo, Creacion, Limite (7 columns, was 8 — removed ID)
  - All field references updated to backend names

- **`src/app/pages/ticket-dashboard/ticket-dashboard.css`**
  - Summary card classes: `.abiertos` (was `.pendientes`), `.cerrados` (was `.finalizados`)
  - Removed `.en-revision`

### Profile Page (collateral fix)
- **`src/app/pages/profile/profile.ts`**
  - `assignedTickets` computed now filters by `t.assignedUserName` instead of `t.asignadoA`
  - Added imports: `TicketBackend`, `TicketStatusBackend`, `TicketPriorityBackend`, `TagSeverity`, mapping constants
  - Replaced `getEstadoSeverity`/`getPrioridadSeverity` with `getStatusSeverity`/`getPrioritySeverity`/`getStatusLabel`/`getPriorityLabel`

- **`src/app/pages/profile/profile.html`**
  - Table column sort fields updated: `title`, `status`, `priority`, `dueDate`
  - Cell values updated: `ticket.title`, `getStatusLabel(ticket.status)`, `getPriorityLabel(ticket.priority)`, `ticket.dueDate`

## Build Status
- **0 errors**
- 1 non-critical CSS budget warning (tickets.css 5.87 kB vs 4 kB budget)

## Architecture Notes

### Signal-based data flow
```
TicketService.loadTickets() → HTTP GET /tickets → tickets signal updated
Component computed signals → filter/transform → template renders
Workflow action (assign/start/finish) → HTTP POST → loadTickets() → signals updated → UI auto-refreshes
```

### Permission checks
```typescript
// Standard module permissions (maps through toBackendPermission)
canCreate = computed(() => this.authService.hasPermission('tickets', 'add'));
canEdit = computed(() => this.authService.hasPermission('tickets', 'edit'));

// Special ticket permissions (raw string check)
canAssign = computed(() => this.authService.hasRawPermission('canAssign_Tickets'));
canUpdateStatus = computed(() => this.authService.hasRawPermission('canUpdateStatus_Tickets'));
```

### Kanban drag & drop transitions
```
Open (1) → InProgress (2): calls startWork() — requires canUpdateStatus
InProgress (2) → Closed (3): calls finishTicket() — requires canUpdateStatus
Any other transition: blocked with warning toast
```
