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
├── components/               # Reusable UI components
│   └── sidebar/              # Sidebar navigation component
│       ├── sidebar.ts        # Component (collapsible, menu items, output event)
│       ├── sidebar.html      # Navigation menu with PrimeNG ripple & tooltips
│       └── sidebar.css       # Dark-themed sidebar styles (260px / 64px collapsed)
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
    │   │   ├── login.ts      # Component (hardcoded credentials, validation, toast, redirect to /dashboard)
    │   │   ├── login.html    # Login form with PrimeNG inputs & validation messages
    │   │   └── login.css
    │   └── register/
    │       ├── register.ts   # Component (full validation, computed signals, phone/password rules)
    │       ├── register.html # Registration form with PrimeNG inputs & real-time validation
    │       └── register.css
    │
    └── home/                 # Dashboard / Home page (post-login)
        ├── home.ts           # Component (welcome panel + module cards grid)
        ├── home.html         # Module overview cards (Inventario, Ventas, etc.)
        ├── home.css          # Responsive grid styles
        └── home.routes.ts    # Route: '' → MainLayout → Home
```

---

## Routing

All routes use **lazy loading** via `loadChildren`.

```
URL                    Component    Loaded From
─────────────────────  ───────────  ──────────────────────────────
/                      redirect  →  /home/landing
/home                  redirect  →  /home/landing
/home/landing          Landing      pages/landing/landing.routes.ts
/auth/login            Login        pages/auth/auth.routes.ts
/auth/register         Register     pages/auth/auth.routes.ts
/dashboard             Home         pages/home/home.routes.ts (wrapped in MainLayout)
/**                    redirect  →  /home/landing
```

**Route file hierarchy:**
- `app.routes.ts` → defines `home`, `auth`, and `dashboard` path prefixes, uses `loadChildren`
- `pages/landing/landing.routes.ts` → `landingRoutes` (child of `home`)
- `pages/auth/auth.routes.ts` → `authRoutes` (children: `login`, `register`)
- `pages/home/home.routes.ts` → `dashboardRoutes` (uses `MainLayout` as parent, `Home` as child)

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
| `ButtonModule` | `primeng/button` | Landing, Login, Register, Home, Sidebar |
| `InputTextModule` | `primeng/inputtext` | Login, Register |
| `PasswordModule` | `primeng/password` | Login, Register |
| `CheckboxModule` | `primeng/checkbox` | Login, Register |
| `DividerModule` | `primeng/divider` | Landing, Login, Register, Home |
| `RippleModule` | `primeng/ripple` | Landing, Sidebar |
| `MessageModule` | `primeng/message` | Login, Register |
| `ToastModule` | `primeng/toast` | Login, Register |
| `TooltipModule` | `primeng/tooltip` | Sidebar |

### Services Used

| Service | Import Path | Purpose |
|---|---|---|
| `MessageService` | `primeng/api` | Toast notifications for success/error messages |

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

## Authentication Implementation

### Login Component

**Hardcoded credentials for simulation:**
- Email: `admin@erp.com`
- Password: `Admin@2025!`

**Features:**
- Credential validation with hardcoded values
- Error messages using `p-message` (inline)
- Success/error notifications with `MessageService` toast
- Visual hint showing test credentials
- Form validation (required fields)
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
- Menu items with PrimeNG `pRipple` and `pTooltip` (tooltips shown only when collapsed)
- Dark theme using `--p-surface-900` background
- Active item indicator with left border in primary color
- Logout button in footer section
- Emits `collapsedChange` output event when toggled

**Menu items (currently placeholder links with `href="#"`):**
- Inicio (`pi-home`)
- Inventario (`pi-box`)
- Ventas (`pi-shopping-cart`)
- Finanzas (`pi-wallet`)
- Recursos Humanos (`pi-users`)
- Reportes (`pi-chart-bar`)
- Configuracion (`pi-cog`)

**How to connect a menu item to a real route:**
Replace `href="#"` with `[routerLink]` and add `routerLinkActive="active"` once the target module route exists. Import `RouterLink` and `RouterLinkActive` from `@angular/router`.

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

## Planned Directory Structure (as the ERP grows)

```
src/app/
├── components/               # Reusable UI components (already exists)
│   └── sidebar/              # ✅ Implemented
│
├── layouts/                  # Layout wrappers (already exists)
│   └── main-layout/          # ✅ Implemented (sidebar + content area)
│
├── pages/                    # Route-level page components
│   ├── landing/              # ✅ Implemented — Public landing
│   ├── auth/                 # ✅ Implemented — Login, Register
│   ├── home/                 # ✅ Implemented — Dashboard home (post-login)
│   ├── inventory/            # Inventory management
│   ├── sales/                # Sales & orders
│   ├── finance/              # Finance & accounting
│   └── hr/                   # Human resources
│
├── shared/                   # Reusable pipes, directives
│   ├── pipes/                # Custom pipes
│   └── directives/           # Custom directives
│
├── core/                     # Singleton services, guards, interceptors
│   ├── services/             # API services, auth service, etc.
│   ├── guards/               # Route guards (auth, role-based)
│   ├── interceptors/         # HTTP interceptors
│   └── models/               # TypeScript interfaces/types
│
├── app.ts
├── app.html
├── app.css
├── app.config.ts
└── app.routes.ts
```

---

## Navigation Map

The landing page has links to login and register. Login redirects to the dashboard on success. Register redirects to login on success.

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
  └── Sidebar links (placeholder, no navigation yet)
```

---

## Key Files Quick Reference

| Need to... | Look at |
|---|---|
| Add a new page/route group | `app.routes.ts` + new folder in `pages/` |
| Add a new auth page | `pages/auth/auth.routes.ts` + new folder in `pages/auth/` |
| Add a reusable component | `components/<name>/` (sidebar pattern) |
| Add/modify a layout | `layouts/<name>/` (main-layout pattern) |
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
