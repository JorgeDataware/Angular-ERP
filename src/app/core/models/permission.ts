// =====================================================================
// TIPOS LEGACY (preservados — NO eliminar)
// =====================================================================
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';
export type PermissionModule = 'groups' | 'users' | 'tickets';

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  groups: ModulePermissions;
  users: ModulePermissions;
  tickets: ModulePermissions;
}

// =====================================================================
// TIPOS NUEVOS — formato real del backend
// =====================================================================

/**
 * Permisos del backend son strings planos:
 * "canRead_Users", "canCreate_Groups", "canUpdate_Tickets", "canDelete_Users",
 * "canAssign_Tickets", "canUpdateStatus_Tickets"
 */
export type BackendPermission = string;

/**
 * Mapeo de acciones frontend → prefijo de permiso backend
 * view → canRead_, add → canCreate_, edit → canUpdate_, delete → canDelete_
 */
const ACTION_TO_BACKEND_PREFIX: Record<PermissionAction, string> = {
  view: 'canRead_',
  add: 'canCreate_',
  edit: 'canUpdate_',
  delete: 'canDelete_',
};

/**
 * Mapeo de módulo frontend → sufijo de permiso backend
 */
const MODULE_TO_BACKEND_SUFFIX: Record<PermissionModule, string> = {
  groups: 'Groups',
  users: 'Users',
  tickets: 'Tickets',
};

/**
 * Convierte (module, action) del frontend a la string de permiso del backend.
 * Ejemplo: ('groups', 'view') → 'canRead_Groups'
 */
export function toBackendPermission(module: PermissionModule, action: PermissionAction): string {
  return `${ACTION_TO_BACKEND_PREFIX[action]}${MODULE_TO_BACKEND_SUFFIX[module]}`;
}

/**
 * Verifica si un array de permisos del backend contiene el permiso correspondiente
 * al (module, action) del frontend.
 */
export function hasBackendPermission(
  permissions: string[],
  module: PermissionModule,
  action: PermissionAction
): boolean {
  return permissions.includes(toBackendPermission(module, action));
}

/**
 * Verifica si un array de permisos del backend contiene un permiso dado
 * directamente por su string (para permisos especiales como canAssign_Tickets).
 */
export function hasRawPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

// =====================================================================
// INTERFAZ DE USUARIO AUTENTICADO — adaptada al backend
// =====================================================================

/**
 * AuthUser legacy (preservada — NO eliminar)
 */
export interface AuthUser {
  id: number;
  email: string;
  password: string;
  fullName: string;
  permissions: RolePermissions;
  groupId?: number;
}

/**
 * AuthUser adaptado al backend real.
 * - id es string (UUID)
 * - permissions es string[] del backend
 * - No tiene password (nunca se almacena en frontend)
 * - Campos del perfil provienen de GET /users/me
 */
export interface AuthUserBackend {
  id: string;
  userName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  permissions: string[];
}
