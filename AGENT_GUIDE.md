# ERP Project — Agent Reference Guide

> **Purpose:** This file is the canonical reference for AI terminal agents working on this codebase.
> Read this before making any changes. Keep it updated when the structure evolves.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Angular (standalone components) | 21.1.x |
| UI Library | PrimeNG + PrimeIcons | 21.1.1 / 7.0.0 |
| Theme | `@primeuix/themes` — Aura preset | 2.0.3 |
| Language | TypeScript (strict mode) | 5.9.x |
| State | Angular Signals | built-in |
| Forms | Template-driven (`FormsModule` + `ngModel` + signals) | — |
| Styling | Component-scoped CSS (plain CSS, no SCSS) | — |
| Font | Space Grotesk (Google Fonts) | wght 300–700 |
| CSS Variables | PrimeNG design tokens (`--p-primary-color`, `--p-surface-*`) | — |
| Build | `@angular/build:application` (esbuild) | — |
| Tests | Vitest | 4.0.8 |
| Package Manager | pnpm | 10.28.x |
| UI Language | Spanish | — |
| Auth Model | 4 roles (superAdmin, groupLeader, developer, usuario) | — |

---

## Commands

```bash
pnpm start          # Dev server (ng serve)
pnpm build          # Production build (ng build)
pnpm test           # Unit tests (vitest)
pnpm ng generate    # Angular CLI generators
```

---

## Project Root Layout

```
C:\Angular\erp\
├── src/
│   ├── main.ts              # Bootstrap: bootstrapApplication(App, appConfig)
│   ├── index.html            # Entry HTML (<app-root>, Google Fonts link)
│   ├── styles.css            # Global styles (primeicons import + Space Grotesk font)
│   └── app/                  # All application code lives here
├── public/                   # Static assets (favicon.ico)
├── angular.json              # Build/serve/test config
├── package.json              # Dependencies + inline prettier config
├── tsconfig.json             # Base TS config (strict: true)
├── tsconfig.app.json         # App TS config
└── tsconfig.spec.json        # Test TS config (vitest/globals)
```

---

## Application Architecture

### Entry Point

- `src/main.ts` → `bootstrapApplication(App, appConfig)`
- `src/app/app.config.ts` → providers: Router, Animations, PrimeNG (Aura theme)
- `src/app/app.ts` → Root component, only renders `<router-outlet />`

### Source Tree

```
src/app/
├── app.ts                    # Root component (shell, router-outlet only)
├── app.html                  # <router-outlet />
├── app.css                   # Empty
├── app.config.ts             # Application providers
├── app.routes.ts             # Top-level route definitions
├── app.spec.ts               # Root component tests
│
├── core/                     # Singleton services, guards, models
│   ├── models/               # TypeScript interfaces/types
│   │   ├── group.ts          # Group interface (id, nivel, autor, nombre, integrantes, tickets, descripcion)
│   │   ├── user.ts           # User interface (id, username, fullName, email, phone, address, groupId, role: UserRole, active)
│   │   ├── ticket.ts         # Ticket, TicketComment, TicketChange, TicketStatus, TicketPriority
│   │   └── permission.ts     # UserRole, AuthUser, RolePermissions, ModulePermissions, PermissionAction, PermissionModule
│   ├── services/             # Application services
│   │   ├── auth.service.ts   # AuthService (login/logout, permission checking, 4 hardcoded users, 4 roles)
│   │   ├── user.service.ts   # UserService (in-memory CRUD, 8 sample users across groups)
│   │   ├── ticket.service.ts # TicketService (in-memory CRUD, comments, change history, 6 sample tickets)
│   │   └── group.service.ts  # GroupService (in-memory CRUD, 5 sample groups)
│   └── guards/               # Route guards
│       ├── auth.guard.ts     # authGuard (functional CanActivateFn, checks login state)
│       └── permission.guard.ts # permissionGuard factory (functional CanActivateFn, checks module+action)
│
├── components/               # Reusable UI components
│   └── sidebar/              # Sidebar navigation component
│       ├── sidebar.ts        # Component (collapsible, dynamic menu based on permissions, user info, logout)
│       ├── sidebar.html      # Navigation menu with PrimeNG ripple & tooltips, user info section
│       └── sidebar.css       # Dark-themed sidebar styles (260px / 64px collapsed, user-info styles)
│
├── layouts/                  # Layout wrappers for authenticated pages
│   └── main-layout/          # Main layout with sidebar + content area
│       ├── main-layout.ts    # Component (wraps sidebar + router-outlet)
│       ├── main-layout.html  # Sidebar + <router-outlet> for child pages
│       └── main-layout.css   # Flex layout with responsive margin
│
└── pages/                    # ALL page components go here
    ├── landing/              # Public landing page
    │   ├── landing.ts        # Component (stateless)
    │   ├── landing.html      # Hero + features + CTA sections
    │   ├── landing.css       # Responsive styles
    │   └── landing.routes.ts # Route: '' → Landing
    │
    ├── auth/                 # Authentication pages
    │   ├── auth.routes.ts    # Routes: login, register
    │   ├── login/
    │   │   ├── login.ts      # Component (4 credential sets, validation, toast, redirect to /dashboard)
    │   │   ├── login.html    # Login form with PrimeNG inputs & validation messages, 4 credential hints
    │   │   └── login.css
    │   └── register/
    │       ├── register.ts   # Component (full validation, computed signals, phone/password rules)
    │       ├── register.html # Registration form with PrimeNG inputs & real-time validation
    │       └── register.css
    │
    ├── home/                 # Dashboard / Home page (post-login)
    │   ├── home.ts           # Component (welcome panel + module cards grid)
    │   ├── home.html         # Module overview cards (Inventario, Ventas, etc.)
    │   ├── home.css          # Responsive grid styles
    │   └── home.routes.ts    # Route: '' → MainLayout → Home
    │
    ├── profile/              # User profile page (RUD + assigned tickets)
    │   ├── profile.ts        # Component (edit mode toggle, register validations, logical delete, assigned tickets table)
    │   ├── profile.html      # Profile form + assigned tickets datatable
    │   ├── profile.css       # Profile card styles + assigned tickets card
    │   └── profile.routes.ts # Route: '' → MainLayout → Profile
    │
    ├── groups/               # Groups CRUD page
    │   ├── groups.ts         # Component (full CRUD via GroupService, navigation to users/tickets, permission-based UI)
    │   ├── groups.html       # Toolbar + DataTable + Dialog form + ConfirmDialog + clickable badges
    │   ├── groups.css        # CRUD layout styles (responsive grid form, table, clickable badges)
    │   └── groups.routes.ts  # Route: '' → MainLayout → Groups
    │
    ├── tickets/              # Tickets CRUD page + Kanban view
    │   ├── tickets.ts        # Component (full CRUD, kanban view toggle, detail dialog with comments + history textarea, filters, permission-based UI)
    │   ├── tickets.html      # Toolbar + view toggle + filters panel + List view (DataTable) + Kanban view + Create/Edit dialog + Detail dialog (comments, history textarea)
    │   ├── tickets.css       # Tickets CRUD styles + kanban board + filter panel + history textarea
    │   └── tickets.routes.ts # Route: '' → MainLayout → Tickets (guarded: authGuard + permissionGuard)
    │
    ├── group-users/          # Group Users CRUD page
    │   ├── group-users.ts    # Component (CRUD for users within a group, permission-based UI)
    │   ├── group-users.html  # Toolbar + DataTable + Create/Edit dialog + back navigation
    │   ├── group-users.css   # Group users styles
    │   └── group-users.routes.ts # Route: '' → MainLayout → GroupUsers (guarded: authGuard + permissionGuard)
    │
    ├── ticket-dashboard/     # Ticket Dashboard page
    │   ├── ticket-dashboard.ts        # Component (summary cards, filters: search/user/group/status/priority/date ranges, filtered table)
    │   ├── ticket-dashboard.html      # Summary cards + filter panel + DataTable
    │   ├── ticket-dashboard.css       # Dashboard styles (cards grid, filter panel)
    │   └── ticket-dashboard.routes.ts # Route: '' → MainLayout → TicketDashboard (guarded: authGuard + permissionGuard)
    │
    └── admin-users/          # Users CRUD for superAdmin
        ├── admin-users.ts         # Component (full CRUD for all users, role/group/active management)
        ├── admin-users.html       # Toolbar + DataTable + Create/Edit dialog (username, fullName, email, phone, address, role, group, active)
        ├── admin-users.css        # Admin users styles
        └── admin-users.routes.ts  # Route: '' → MainLayout → AdminUsers (guarded: authGuard + permissionGuard('users','add'))
```

### How to Add a New Route Group

```
src/app/shared/
    └── directives/
        └── has-permission.directive.ts  # HasPermissionDirective (structural, *appHasPermission="['module','action']")
```

---

## Routing

All routes use **lazy loading** via `loadChildren`.

```
URL                              Component         Loaded From                                      Guards
───────────────────────────────  ────────────────  ──────────────────────────────────────────────  ──────────────────────
/                                redirect       →  /home/landing
/home                            redirect       →  /home/landing
/home/landing                    Landing           pages/landing/landing.routes.ts
/auth/login                      Login             pages/auth/auth.routes.ts
/auth/register                   Register          pages/auth/auth.routes.ts
/dashboard                       Home              pages/home/home.routes.ts (MainLayout)           authGuard
/profile                         Profile           pages/profile/profile.routes.ts (MainLayout)     authGuard
/groups                          Groups            pages/groups/groups.routes.ts (MainLayout)        authGuard + permissionGuard('groups','view')
/groups/:groupId/users           GroupUsers        pages/group-users/group-users.routes.ts           authGuard + permissionGuard('users','view')
/tickets                         Tickets           pages/tickets/tickets.routes.ts (MainLayout)      authGuard + permissionGuard('tickets','view')
/tickets/:groupId                Tickets           (same, filtered by group)                         authGuard + permissionGuard('tickets','view')
/ticket-dashboard                TicketDashboard   pages/ticket-dashboard/ticket-dashboard.routes.ts authGuard + permissionGuard('tickets','view')
/ticket-dashboard/:groupId       TicketDashboard   (same, filtered by group)                         authGuard + permissionGuard('tickets','view')
/admin/users                     AdminUsers        pages/admin-users/admin-users.routes.ts           authGuard + permissionGuard('users','add')
/**                              redirect       →  /home/landing
```

**Route file hierarchy:**
- `app.routes.ts` → defines all path prefixes, uses `loadChildren`, applies auth/permission guards
- `pages/landing/landing.routes.ts` → `landingRoutes` (child of `home`)
- `pages/auth/auth.routes.ts` → `authRoutes` (children: `login`, `register`)
- `pages/home/home.routes.ts` → `dashboardRoutes` (uses `MainLayout` as parent, `Home` as child)
- `pages/profile/profile.routes.ts` → `profileRoutes` (uses `MainLayout` as parent, `Profile` as child)
- `pages/groups/groups.routes.ts` → `groupsRoutes` (uses `MainLayout` as parent, `Groups` as child)
- `pages/tickets/tickets.routes.ts` → `ticketsRoutes` (uses `MainLayout` as parent, `Tickets` as child)
- `pages/group-users/group-users.routes.ts` → `groupUsersRoutes` (uses `MainLayout` as parent, `GroupUsers` as child)
- `pages/ticket-dashboard/ticket-dashboard.routes.ts` → `ticketDashboardRoutes` (uses `MainLayout` as parent, `TicketDashboard` as child)
- `pages/admin-users/admin-users.routes.ts` → `adminUsersRoutes` (uses `MainLayout` as parent, `AdminUsers` as child)

### How to Add a New Route Group

1. Create folder under `src/app/pages/<group-name>/`
2. Create `<group-name>.routes.ts` exporting a `Routes` array
3. Add to `app.routes.ts`:
   ```ts
   {
     path: '<group-name>',
     loadChildren: () =>
       import('./pages/<group-name>/<group-name>.routes').then(m => m.<groupName>Routes),
   }
   ```

---

## Component Conventions

### File Naming

| What | Pattern | Example |
|---|---|---|
| Page component | `src/app/pages/<section>/<name>/<name>.ts` | `pages/auth/login/login.ts` |
| Page template | `src/app/pages/<section>/<name>/<name>.html` | `pages/auth/login/login.html` |
| Page styles | `src/app/pages/<section>/<name>/<name>.css` | `pages/auth/login/login.css` |
| Route file | `src/app/pages/<section>/<section>.routes.ts` | `pages/auth/auth.routes.ts` |
| Shared component | `src/app/components/<name>/<name>.ts` | `components/sidebar/sidebar.ts` |
| Layout component | `src/app/layouts/<name>/<name>.ts` | `layouts/main-layout/main-layout.ts` |

### Component Structure

All components are **standalone** (no NgModules). Pattern:

```ts
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
// PrimeNG imports as needed

@Component({
  selector: 'app-<name>',
  imports: [RouterLink, /* PrimeNG modules */],
  templateUrl: './<name>.html',
  styleUrl: './<name>.css'
})
export class <Name> {
  // State via Angular signals
  someField = signal('');
}
```

### State Management

- Use Angular **signals** for component state (`signal()`, `computed()`, `effect()`)
- No NgRx, no services for state yet
- Forms use **template-driven** approach: `FormsModule` + `[ngModel]="field()"` + `(ngModelChange)="field.set($event)"`

---

## PrimeNG Usage

### Already Used Modules

| Module | Import Path | Where |
|---|---|---|
| `ButtonModule` | `primeng/button` | Landing, Login, Register, Home, Sidebar, Groups, Profile, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `InputTextModule` | `primeng/inputtext` | Login, Register, Profile, Groups, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `PasswordModule` | `primeng/password` | Login, Register, Profile |
| `CheckboxModule` | `primeng/checkbox` | Login, Register, Profile |
| `DividerModule` | `primeng/divider` | Landing, Login, Register, Home |
| `RippleModule` | `primeng/ripple` | Landing, Sidebar |
| `MessageModule` | `primeng/message` | Login, Register, Profile |
| `ToastModule` | `primeng/toast` | Login, Register, Groups, Profile, Tickets, GroupUsers, AdminUsers |
| `TooltipModule` | `primeng/tooltip` | Sidebar, Groups, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `InputNumberModule` | `primeng/inputnumber` | Groups |
| `TableModule` | `primeng/table` | Groups, Tickets, GroupUsers, TicketDashboard, Profile, AdminUsers |
| `DialogModule` | `primeng/dialog` | Groups, Tickets, GroupUsers, AdminUsers |
| `ConfirmDialogModule` | `primeng/confirmdialog` | Groups, Profile, Tickets, GroupUsers, AdminUsers |
| `ToolbarModule` | `primeng/toolbar` | Groups, Tickets, GroupUsers, AdminUsers |
| `TagModule` | `primeng/tag` | Groups, Profile, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `TextareaModule` | `primeng/textarea` | Groups, Tickets |
| `IconFieldModule` | `primeng/iconfield` | Groups, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `InputIconModule` | `primeng/inputicon` | Groups, Tickets, GroupUsers, TicketDashboard, AdminUsers |
| `SelectModule` | `primeng/select` | Tickets, TicketDashboard, AdminUsers |
| `DatePickerModule` | `primeng/datepicker` | Tickets, TicketDashboard |
| `TabsModule` | `primeng/tabs` | Tickets |
| `CardModule` | `primeng/card` | TicketDashboard |
| `ToggleButtonModule` | `primeng/togglebutton` | Tickets |

### Services Used

| Service | Import Path | Purpose |
|---|---|---|
| `MessageService` | `primeng/api` | Toast notifications for success/error messages |
| `ConfirmationService` | `primeng/api` | Confirmation dialogs for destructive actions |
| `AuthService` | `core/services/auth.service` | Login/logout, permission checking, current user state |
| `UserService` | `core/services/user.service` | In-memory user CRUD (8 sample users) |
| `TicketService` | `core/services/ticket.service` | In-memory ticket CRUD with comments and change history |
| `GroupService` | `core/services/group.service` | In-memory group CRUD (5 sample groups, shared across components) |

### Theme / Styling

- Theme preset: **Aura** (configured in `app.config.ts` via `providePrimeNG`)
- **Global font:** Space Grotesk (loaded from Google Fonts via `<link>` in `index.html`, applied in `styles.css` on `body`)
- PrimeIcons imported globally in `src/styles.css`
- Use PrimeNG CSS variables for colors: `--p-primary-color`, `--p-primary-50`, `--p-surface-0` through `--p-surface-900`
- Component styles are **scoped CSS** (not global)

### Adding New PrimeNG Components

1. Import the module in the component's `imports` array (no need for app-level registration)
2. Use PrimeNG CSS variables for consistent theming
3. Reference: https://primeng.org/

### PrimeNG Checkbox Labels

⚠️ **Important**: The `label` attribute on `p-checkbox` does NOT render visually in PrimeNG 21.x.

**Correct pattern:**
```html
<div class="field-checkbox">
  <p-checkbox
    [ngModel]="field()"
    (ngModelChange)="field.set($event)"
    name="field"
    [binary]="true"
    inputId="field"
  />
  <label for="field" class="checkbox-label">Label text</label>
</div>
```

**CSS for checkbox labels:**
```css
.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  font-size: 0.9rem;
  color: var(--p-surface-700);
  cursor: pointer;
  user-select: none;
}
```

---

## Authentication & Permissions

### AuthService

**Location:** `src/app/core/services/auth.service.ts`

**Four hardcoded credential sets (4 roles):**

| Role | Email | Password | Permissions |
|---|---|---|---|
| superAdmin | `superadmin@erp.com` | `Super@2025!` | Full access: view/edit/delete/add on groups, users, tickets |
| groupLeader | `lider@erp.com` | `Lider@2025!` | Groups (view/edit), Users (view/edit), Tickets (all) |
| developer | `dev@erp.com` | `Devel@2025!` | Tickets (view), Groups (view) |
| usuario | `usuario@erp.com` | `User@2025!` | Tickets (view/add) |

**AuthService API:**
- `login(email, password): boolean` — authenticates and sets current user
- `logout(): void` — clears session, redirects to login
- `isLoggedIn(): boolean` — signal-based login state
- `currentUser(): AuthUser | null` — current authenticated user signal
- `hasPermission(module, action): boolean` — checks if current user has permission
- `getRoleLabel(role): string` — returns Spanish display label for role
- `isSuperAdmin / isGroupLeader / isDeveloper / isUsuario` — computed signals for role checks

### Permission Model

**Modules:** `groups`, `users`, `tickets`
**Actions:** `view`, `edit`, `delete`, `add`

Admin permissions: all actions on all modules.
groupLeader permissions: `groups.view/edit`, `users.view/edit`, `tickets.*` (all).
developer permissions: `tickets.view`, `groups.view`.
usuario permissions: `tickets.view/add`.

### Guards

| Guard | Location | Purpose |
|---|---|---|
| `authGuard` | `core/guards/auth.guard.ts` | Functional `CanActivateFn`, redirects to `/auth/login` if not logged in |
| `permissionGuard(module, action)` | `core/guards/permission.guard.ts` | Factory returning `CanActivateFn`, redirects to `/dashboard` if permission denied |

### HasPermissionDirective

**Location:** `src/app/shared/directives/has-permission.directive.ts`

Structural directive that shows/hides elements based on user permissions.

```html
<p-button *appHasPermission="['groups', 'add']" label="Nuevo Grupo" ... />
```

### Login Component

**Features:**
- Credential validation via `AuthService`
- Shows all four credential hints (superAdmin, groupLeader, developer, usuario)
- Error messages using `p-message` (inline)
- Success/error notifications with `MessageService` toast
- **Auto-redirect to `/dashboard` after 1.5 seconds on successful login**

### Register Component

**Required fields:**
- `username` — Username
- `fullName` — Full name
- `email` — Email address
- `password` — Password (min 10 chars + special symbols)
- `confirmPassword` — Password confirmation
- `phone` — Phone number (digits only, min 10)
- `address` — Address
- `isAdult` — Checkbox: "Acepto que soy mayor de edad"
- `acceptTerms` — Checkbox: "Acepto los términos y condiciones"

**Password validation rules:**
- Minimum 10 characters
- Must include at least one special symbol: `!@#$%^&*`
- Real-time validation with error messages

**Phone validation:**
- Numeric input only (auto-filtered)
- Minimum 10 digits
- Maximum 15 characters

**Form behavior:**
- Submit button disabled until all validations pass
- Uses `computed()` signals for reactive validation
- Real-time feedback with color-coded messages (red for errors, green for success)
- Toast notification on successful registration
- Auto-redirect to login after 2 seconds on success

**Validation messages:**
- Password requirements shown with hints
- Password match/mismatch indicator
- Phone number format validation
- Visual feedback for form completeness

---

## Sidebar Component

**Location:** `src/app/components/sidebar/`

**Features:**
- Collapsible sidebar (260px expanded, 64px collapsed)
- Toggle button with animated arrow icon
- **Dynamic menu items** filtered by user permissions via `computed()`
- User info section showing current user name and role
- Menu items with PrimeNG `pRipple` and `pTooltip` (tooltips shown only when collapsed)
- Dark theme using `--p-surface-900` background
- Active item indicator with left border in primary color via `routerLinkActive`
- App version label (`v0.0.2`) displayed above logout button in footer
- Logout via `AuthService.logout()` in footer section
- Emits `collapsedChange` output event when toggled

**Menu items (permission-filtered, connected via `routerLink` + `routerLinkActive`):**
- Perfil (`pi-user`) → `/profile` (always visible when logged in)
- Grupos (`pi-users`) → `/groups` (requires `groups.view`)
- Tickets (`pi-ticket`) → `/tickets` (requires `tickets.view`)
- Dashboard (`pi-chart-bar`) → `/ticket-dashboard` (requires `tickets.view`)
- Usuarios (`pi-id-card`) → `/admin/users` (requires `users.add` — superAdmin only)

---

## MainLayout

**Location:** `src/app/layouts/main-layout/`

**Purpose:** Layout wrapper for all authenticated/post-login pages. Renders the Sidebar and a `<router-outlet>` for child page content.

**Structure:**
- `MainLayout` component imports `Sidebar` and `RouterOutlet`
- Listens to `collapsedChange` event from Sidebar to adjust content margin
- Main content area has `margin-left: 260px` (or `64px` when sidebar is collapsed)

**Usage in route files:**
```ts
export const someRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: SomePage },
    ],
  },
];
```

---

## Groups Page (CRUD)

**Location:** `src/app/pages/groups/`

**Route:** `/groups` (guarded: `authGuard` + `permissionGuard('groups','view')`)

**Model:** `src/app/core/models/group.ts`

```ts
export interface Group {
  id: number;
  nivel: string;       // Alto, Medio, Bajo
  autor: string;       // Creator/author of the group
  nombre: string;      // Group name
  integrantes: number; // Number of members
  tickets: number;     // Number of tickets
  descripcion: string; // Description
}
```

**Features:**
- Full CRUD operations (Create, Read, Update, Delete) — **permission-gated** via `*appHasPermission`
- PrimeNG `p-table` (DataTable) with sorting, pagination, striped rows, and row hover
- Toolbar with "Nuevo Grupo" button (hidden if no `groups.add` permission) and search input
- **Clickable integrantes badge** → navigates to `/groups/:groupId/users` (group users CRUD)
- **Clickable tickets badge** → navigates to `/ticket-dashboard/:groupId` (group ticket dashboard)
- Create/Edit modal dialog (`p-dialog`) with form validation and error messages
- Delete confirmation via `p-confirmdialog` + `ConfirmationService`
- Edit/Delete buttons hidden based on `groups.edit` / `groups.delete` permissions
- `p-tag` with severity colors for nivel column (Alto=danger, Medio=warn, Bajo=success)
- Toast notifications (`MessageService`) for create/update/delete feedback
- Data stored in-memory via `GroupService` (centralized signal-based service, shared across components)

**CRUD Pattern (reusable for future modules):**
1. Define interface in `core/models/<entity>.ts`
2. Component state: `signal<Entity[]>([...])` for data, `signal()` for each form field
3. Dialog visibility: `dialogVisible = signal(false)`, `isEditMode = signal(false)`
4. Validation: `isFormValid = computed(...)` checking all required fields
5. Actions: `openNew()`, `editEntity()`, `confirmDelete()`, `saveEntity()`, `hideDialog()`
6. Search: `searchValue = signal('')` + `filteredData = computed(...)` filtering the list
7. Feedback: `MessageService` for toast, `ConfirmationService` for delete confirmation

---

## Home Page (Dashboard)

**Location:** `src/app/pages/home/`

**Route:** `/dashboard`

**Features:**
- Welcome header ("Bienvenido al ERP")
- Responsive grid of module cards (Inventario, Ventas, Finanzas, RRHH, Reportes, Configuracion)
- Each card has an icon, title, and description
- Hover effects on cards (elevation + primary border)
- Wrapped inside `MainLayout` (sidebar is always visible)

---

## Profile Page (RUD + Assigned Tickets)

**Location:** `src/app/pages/profile/`

**Route:** `/profile`

**Features:**
- **Read:** All fields displayed in readonly by default with pre-filled data
- **Update:** "Editar" button enables all inputs for editing; "Guardar" saves, "Cancelar" restores original values
- **Delete (logical):** "Desactivar cuenta" triggers a confirmation dialog and sets a `deleted` signal to `true`; card shows a red border, reduced opacity, and a "Cuenta desactivada" tag; "Restaurar cuenta" reverses the state
- **Assigned Tickets datatable:** A `p-table` showing tickets assigned to the current user (columns: ID, Titulo, Estado, Prioridad, Limite). Uses `TicketService` + `AuthService` with a `computed()` signal filtering by `asignadoA`. Status and priority shown with color-coded `p-tag`.
- Validations are **identical to the Register component**:
  - Username: no spaces allowed
  - Full name: no double spaces
  - Email: no spaces allowed
  - Phone: digits only, exactly 10 characters
  - Password: min 10 chars, no spaces, at least one special symbol (`!@#$%^&*`)
  - Confirm password: must match password
  - Address: required (non-empty)
  - Checkboxes: both must be checked
- "Guardar" button disabled until `isFormValid()` returns true
- Backup/restore pattern: original values saved before editing, restored on cancel
- Toast notifications for save, delete, and restore actions
- `ConfirmationService` + `p-confirmdialog` for delete confirmation

---

## Tickets Page (CRUD + Kanban View)

**Location:** `src/app/pages/tickets/`

**Route:** `/tickets` (guarded: `authGuard` + `permissionGuard('tickets','view')`)

**Models:** `src/app/core/models/ticket.ts`

```ts
type TicketStatus = 'pendiente' | 'en progreso' | 'en revisión' | 'finalizado';
type TicketPriority = 'alta' | 'media' | 'baja';

interface Ticket {
  id: number; titulo: string; descripcion: string; estado: TicketStatus;
  asignadoA: string; prioridad: TicketPriority; grupoId: number; grupo: string;
  fechaCreacion: Date; fechaLimite: Date; comentarios: TicketComment[];
  historialCambios: TicketChange[];
}
```

**Features:**
- **View toggle:** Two `p-button` components to switch between List view and Kanban view (controlled by `isKanbanView` signal)
- **Filters panel:** Collapsible filter section with search, status, priority, and assigned user filters
- **List view:** Full CRUD with `p-table` (DataTable), sorting, pagination, permission-gated buttons (`*appHasPermission`)
- **Kanban view:** 4-column board (one per status: Pendiente, En Progreso, En Revisión, Finalizado) with cards showing titulo, asignadoA, prioridad tag, and fecha de creación. Uses `kanbanColumns` computed signal grouping filtered tickets by status.
- **Create/Edit dialog:** All ticket fields (titulo, descripcion, estado, asignadoA, prioridad, fechaLimite)
- **Detail dialog:** PrimeNG Tabs showing: ticket info, comments (add new), and **change history textarea** (readonly `<textarea pTextarea>` with monospace font showing `historialCambios` formatted as text via `changeHistoryText` computed signal)
- Status tags with color coding (pendiente=warn, en progreso=info, en revisión=secondary, finalizado=success)
- Priority tags (alta=danger, media=warn, baja=success)
- In-memory data via `TicketService` (6 sample tickets)

---

## Group Users Page (CRUD)

**Location:** `src/app/pages/group-users/`

**Route:** `/groups/:groupId/users` (guarded: `authGuard` + `permissionGuard('users','view')`)

**Model:** `src/app/core/models/user.ts`

```ts
interface User {
  id: number; nombre: string; email: string; grupo: string;
  grupoId: number; rol: string; activo: boolean; fechaCreacion: Date;
}
```

**Features:**
- CRUD for users filtered by group (groupId from route params, groupName from query params)
- Back button to return to `/groups`
- Permission-gated add/edit/delete buttons
- DataTable with sorting, pagination
- In-memory data via `UserService` (8 sample users across groups)

---

## Ticket Dashboard Page

**Location:** `src/app/pages/ticket-dashboard/`

**Routes:**
- `/ticket-dashboard` — all tickets (guarded: `authGuard` + `permissionGuard('tickets','view')`)
- `/ticket-dashboard/:groupId` — filtered by group

**Features:**
- Summary cards: total tickets, by status (pendiente, en progreso, en revisión, finalizado)
- Filter panel: user, group, status, priority, date range (creation), date range (deadline)
- Filtered DataTable showing matching tickets
- When accessed via group (from Groups page), pre-filters by that group
- Uses `TicketService` and `UserService` for data

---

## Planned Directory Structure (as the ERP grows)

```
src/app/
├── components/               # Reusable UI components (already exists)
│   └── sidebar/              # ✅ Implemented (permission-filtered menu, user info)
│
├── layouts/                  # Layout wrappers (already exists)
│   └── main-layout/          # ✅ Implemented (sidebar + content area)
│
├── pages/                    # Route-level page components
│   ├── landing/              # ✅ Implemented — Public landing
│   ├── auth/                 # ✅ Implemented — Login (AuthService), Register
│   ├── home/                 # ✅ Implemented — Dashboard home (post-login)
│   ├── groups/               # ✅ Implemented — Groups CRUD (permission-gated, clickable navigation)
│   ├── tickets/              # ✅ Implemented — Tickets CRUD (comments, history, permission-gated)
│   ├── group-users/          # ✅ Implemented — Group Users CRUD (filtered by group)
│   ├── ticket-dashboard/     # ✅ Implemented — Ticket Dashboard (filters, summary cards)
│   ├── admin-users/          # ✅ Implemented — Users CRUD for superAdmin (role/group/active management)
│   ├── profile/              # ✅ Implemented — User profile (RUD + assigned tickets datatable)
│   ├── inventory/            # Inventory management
│   ├── sales/                # Sales & orders
│   ├── finance/              # Finance & accounting
│   └── hr/                   # Human resources
│
├── shared/                   # Reusable pipes, directives
│   ├── pipes/                # Custom pipes
│   └── directives/           # ✅ HasPermissionDirective
│
├── core/                     # Singleton services, guards, interceptors
│   ├── services/             # ✅ AuthService, UserService, TicketService, GroupService
│   ├── guards/               # ✅ authGuard, permissionGuard
│   ├── interceptors/         # HTTP interceptors
│   └── models/               # ✅ Group, User, Ticket, Permission models
│
├── app.ts
├── app.html
├── app.css
├── app.config.ts
└── app.routes.ts
```

---

## Navigation Map

The landing page has links to login and register. Login redirects to the dashboard on success. Register redirects to login on success. The sidebar provides navigation to Profile and Groups pages.

```
Landing (/home/landing)
  ├── → Login (/auth/login)
  └── → Register (/auth/register)

Login (/auth/login)
  ├── → Register (/auth/register)
  ├── → Landing (/home/landing)
  └── → Dashboard (/dashboard)  [on successful login, after 1.5s]

Register (/auth/register)
  ├── → Login (/auth/login)
  └── → Landing (/home/landing)

Dashboard (/dashboard)  [MainLayout + Home]
  └── Sidebar → Profile, Groups*, Tickets*, Dashboard*, Usuarios*

Profile (/profile)  [MainLayout + Profile]
  └── Sidebar → same
  └── Assigned Tickets datatable (tickets assigned to current user)

Groups (/groups)  [MainLayout + Groups]  [requires groups.view]
  ├── Click integrantes → Group Users (/groups/:id/users)
  ├── Click tickets → Ticket Dashboard (/ticket-dashboard/:id)
  └── Sidebar → same

Group Users (/groups/:groupId/users)  [MainLayout + GroupUsers]  [requires users.view]
  └── Back button → Groups (/groups)

Tickets (/tickets)  [MainLayout + Tickets]  [requires tickets.view]
  ├── List view (DataTable) / Kanban view (4-column board) — toggle
  ├── Filters panel (search, status, priority, user)
  └── Sidebar → same

Ticket Dashboard (/ticket-dashboard)  [MainLayout + TicketDashboard]  [requires tickets.view]
Ticket Dashboard (/ticket-dashboard/:groupId)  [filtered by group]
  └── Sidebar → same

Admin Users (/admin/users)  [MainLayout + AdminUsers]  [requires users.add — superAdmin only]
  └── Full CRUD for all users (role, group, active management)

* Sidebar items are dynamically shown/hidden based on user permissions
```

---

## Key Files Quick Reference

| Need to... | Look at |
|---|---|
| Add a new page/route group | `app.routes.ts` + new folder in `pages/` |
| Add a new auth page | `pages/auth/auth.routes.ts` + new folder in `pages/auth/` |
| Add a reusable component | `components/<name>/` (sidebar pattern) |
| Add/modify a layout | `layouts/<name>/` (main-layout pattern) |
| Add a new guarded route | `app.routes.ts` (use `authGuard` + `permissionGuard`) |
| Add a new permission-gated UI | Use `*appHasPermission="['module','action']"` directive |
| Update permission definitions | `core/services/auth.service.ts` (ROLE_PERMISSIONS constant) |
| Manage groups data | `core/services/group.service.ts` (GroupService, shared group state) |
| Add a new model | `core/models/<entity>.ts` |
| Add a new service | `core/services/<entity>.service.ts` (providedIn: 'root') |
| Change app-wide providers | `app.config.ts` |
| Change PrimeNG theme | `app.config.ts` (the `providePrimeNG` call) |
| Change the global font | `src/index.html` (Google Fonts link) + `src/styles.css` (body font-family) |
| Add global styles | `src/styles.css` |
| Add static assets | `public/` directory |
| Modify TS compiler options | `tsconfig.json` |
| Change build/serve config | `angular.json` |
| See all dependencies | `package.json` |

---

## Rules for Agents

1. **ALL UI elements MUST use PrimeNG components** — this is mandatory. Never use raw HTML `<input>`, `<button>`, `<select>`, `<textarea>`, or any other form/UI element when a PrimeNG equivalent exists. Every button must use `ButtonModule`, every input must use `InputTextModule`, etc. The only exception is structural HTML (`<div>`, `<section>`, `<nav>`, `<header>`, etc.) and `<label>` elements.
2. **All components must be standalone** — never create NgModules.
3. **Use Angular signals** for component state, not class properties with manual change detection.
4. **Template-driven forms** with `FormsModule` — match the existing pattern with `[ngModel]` + `(ngModelChange)` bound to signals.
5. **Lazy load** all route groups via `loadChildren` in `app.routes.ts`.
6. **Each route group** gets its own `*.routes.ts` file inside its `pages/<group>/` directory.
7. **Component-scoped CSS only** — use PrimeNG CSS variables (`--p-*`) for theming consistency.
8. **Spanish** for all user-facing text.
9. **File naming**: lowercase, no prefix, just `<name>.ts`, `<name>.html`, `<name>.css` (Angular 21 convention, no `.component` suffix).
10. **Build check**: run `pnpm build` after structural changes to verify compilation.
11. **Package manager**: always use `pnpm`, never `npm` or `yarn`.
12. **PrimeNG checkboxes**: Do NOT use the `label` attribute. Always use a separate `<label for="...">` element with matching `inputId`.
13. **Form validation**: Use `computed()` signals for reactive validation logic. Disable submit buttons when form is invalid.
14. **User feedback**: Use `MessageService` with `p-toast` for notifications, and `p-message` for inline validation errors.
15. **Global font**: The project uses **Space Grotesk** from Google Fonts. Do not override `font-family` on `body` or `html` in component styles. If a component needs a different font for a specific element, use a scoped class.
16. **Authenticated pages must use MainLayout**: All post-login pages must be wrapped inside `MainLayout` (which provides the sidebar). Define child routes under `MainLayout` in the route file (see `home.routes.ts` as reference).
17. **Reusable components** go in `src/app/components/<name>/`, not in `pages/` or `shared/`.
18. **Permission-gated UI**: Use `*appHasPermission="['module','action']"` structural directive to show/hide buttons and UI elements based on the current user's permissions. Import `HasPermissionDirective` in the component's `imports` array.
19. **Route protection**: Apply `authGuard` to all authenticated routes. Apply `permissionGuard('module','action')` to routes that require specific permissions.
20. **PrimeNG 21.x module names**: Use `SelectModule` (from `primeng/select`) NOT `DropdownModule`. Use `DatePickerModule` (from `primeng/datepicker`) NOT `CalendarModule`. Use `TabsModule` (from `primeng/tabs`) NOT `TabViewModule`.
21. **In-memory data**: All data is stored in-memory via Angular signals in services. No backend/API calls. Services are `providedIn: 'root'` (singletons).
22. **Ticket change history**: When a ticket is updated, record the change in `historialCambios` array with field name, old value, new value, date, and user who made the change.
