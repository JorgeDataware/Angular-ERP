import { RolePermissions } from './permission';

// =====================================================================
// INTERFAZ LEGACY (preservada — NO eliminar)
// =====================================================================
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  groupId: number;
  active: boolean;
  permissions: RolePermissions;
}

// =====================================================================
// INTERFACES DEL BACKEND REAL
// =====================================================================

/**
 * Modelo de usuario tal como lo devuelve el API Gateway.
 * Endpoints: GET /users, GET /users/:userId
 * - id es UUID (string)
 * - permissions es string[] (nombres de permisos, e.g. "canRead_Users")
 * - middleName puede ser null
 * - NO tiene phone, address, groupId, active
 */
export interface UserBackend {
  id: string;
  userName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  permissions: string[];
}

/**
 * Payload para crear un usuario via POST /users.
 * Campos requeridos: userName, firstName, lastName, email, password
 * Campo opcional: middleName
 */
export interface CreateUserPayload {
  userName: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Payload para actualizar un usuario via PUT /users/:userId.
 * Todos los campos son opcionales (enviar solo los que cambian).
 */
export interface UpdateUserPayload {
  userName?: string;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  email?: string;
}

/**
 * Payload para cambiar contraseña via PATCH /users/:userId/password.
 * currentPassword requerido cuando el usuario cambia su propia contraseña.
 */
export interface ChangePasswordPayload {
  currentPassword?: string | null;
  newPassword: string;
}

/**
 * Payload para actualizar permisos via PUT /users/:userId/permissions.
 * permissionIds es un array de UUIDs de permisos.
 */
export interface UpdatePermissionsPayload {
  permissionIds: string[];
}

/**
 * Definición de un permiso del sistema, como viene de GET /users/permissions.
 * Se usa para construir el UI de asignación de permisos.
 */
export interface PermissionDefinition {
  id: string;
  name: string;
}

/**
 * Payload para desactivar un usuario via DELETE /users/:userId/status.
 * status: 0 = inactivo, 1 = activo
 */
export interface DeactivateUserPayload {
  status: number;
}

/**
 * Payload para registro público via POST /users/register.
 * No requiere autenticación ni permisos.
 * Mismo cuerpo que CreateUserPayload (sin permissionIds).
 */
export interface RegisterUserPayload {
  userName: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  password: string;
}
